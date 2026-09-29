const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { withCache } = require('../middleware/cache');
const { getSpatialCells } = require('../services/queries');
const { MAP_SOURCE_URLS, MAP_SOURCE_META } = require('../config/mapSource');

const LOCAL_STATE_TOPOJSON = path.join(__dirname, '..', 'data', 'india-states-topo.json');
let cache = null;
let loadPromise = null;

function cleanText(value) {
  return String(value ?? '')
    .replace(/\u0000/g, '')
    .trim();
}

function parseDbf(buffer) {
  const view = new DataView(buffer);
  const numRecords = view.getUint32(4, true);
  const headerLength = view.getUint16(8, true);
  const recordLength = view.getUint16(10, true);
  const decoder = new TextDecoder('windows-1252');
  const fields = [];

  for (let offset = 32; offset < headerLength - 1; offset += 32) {
    const first = view.getUint8(offset);
    if (first === 0x0d) break;
    let rawName = new Uint8Array(buffer, offset, 11);
    let end = rawName.indexOf ? rawName.indexOf(0) : -1;
    if (end < 0) end = 11;
    const name = decoder.decode(rawName.slice(0, end)).trim();
    const type = String.fromCharCode(view.getUint8(offset + 11));
    const length = view.getUint8(offset + 16);
    const decimals = view.getUint8(offset + 17);
    fields.push({ name, type, length, decimals });
  }

  const records = [];
  for (let row = 0; row < numRecords; row += 1) {
    const recordStart = headerLength + row * recordLength;
    if (recordStart + recordLength > buffer.byteLength) break;
    if (view.getUint8(recordStart) === 0x2a) {
      records.push(null);
      continue;
    }
    let cursor = recordStart + 1;
    const record = {};
    for (const field of fields) {
      const bytes = new Uint8Array(buffer, cursor, field.length);
      const raw = cleanText(decoder.decode(bytes));
      cursor += field.length;
      if (!raw) {
        record[field.name] = null;
      } else if (field.type === 'N' || field.type === 'F') {
        const number = Number(raw);
        record[field.name] = Number.isFinite(number) ? number : raw;
      } else if (field.type === 'L') {
        record[field.name] = ['Y', 'y', 'T', 't'].includes(raw[0]);
      } else {
        record[field.name] = raw;
      }
    }
    records.push(record);
  }
  return records;
}

function signedArea(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}

function ringContains(outer, point) {
  let inside = false;
  for (let i = 0, j = outer.length - 1; i < outer.length; j = i++) {
    const xi = outer[i][0];
    const yi = outer[i][1];
    const xj = outer[j][0];
    const yj = outer[j][1];
    const intersects = ((yi > point[1]) !== (yj > point[1]))
      && (point[0] < ((xj - xi) * (point[1] - yi)) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function parseShp(buffer) {
  const view = new DataView(buffer);
  const shapeType = view.getInt32(32, true);
  if (shapeType !== 5) {
    throw new Error(`Unsupported state map shapefile geometry type ${shapeType}; expected Polygon (5).`);
  }

  const features = [];
  let offset = 100;
  while (offset + 8 <= buffer.byteLength) {
    const contentLengthWords = view.getInt32(offset + 4, false);
    const contentLength = contentLengthWords * 2;
    const contentStart = offset + 8;
    if (contentStart + contentLength > buffer.byteLength) break;

    const recordShapeType = view.getInt32(contentStart, true);
    if (recordShapeType === 0) {
      features.push(null);
      offset = contentStart + contentLength;
      continue;
    }
    if (recordShapeType !== 5) {
      features.push(null);
      offset = contentStart + contentLength;
      continue;
    }

    const numParts = view.getInt32(contentStart + 36, true);
    const numPoints = view.getInt32(contentStart + 40, true);
    const partsStart = contentStart + 44;
    const pointsStart = partsStart + numParts * 4;
    const partIndexes = [];
    for (let i = 0; i < numParts; i += 1) partIndexes.push(view.getInt32(partsStart + i * 4, true));

    const points = [];
    for (let i = 0; i < numPoints; i += 1) {
      const x = view.getFloat64(pointsStart + i * 16, true);
      const y = view.getFloat64(pointsStart + i * 16 + 8, true);
      points.push([x, y]);
    }

    const rings = [];
    for (let i = 0; i < numParts; i += 1) {
      const start = partIndexes[i];
      const end = i + 1 < numParts ? partIndexes[i + 1] : points.length;
      const ring = points.slice(start, end);
      if (ring.length >= 4) rings.push(ring);
    }

    const outers = rings.filter((ring) => signedArea(ring) < 0);
    const holes = rings.filter((ring) => signedArea(ring) >= 0);
    const polygons = outers.map((outer) => [outer]);
    for (const hole of holes) {
      const parent = polygons.find((polygon) => ringContains(polygon[0], hole[0]));
      if (parent) parent.push(hole);
      else polygons.push([hole]);
    }

    features.push({
      type: 'Feature',
      properties: {},
      geometry: polygons.length === 1 ? { type: 'Polygon', coordinates: polygons[0] } : { type: 'MultiPolygon', coordinates: polygons },
    });

    offset = contentStart + contentLength;
  }
  return features;
}

function pickStateName(properties) {
  const candidates = [
    properties.ST_NM,
    properties.STNAME,
    properties.STATE_NAME,
    properties.NAME_1,
    properties.NAME,
    properties.st_nm,
    properties.state,
  ];
  const value = candidates.find((item) => cleanText(item));
  return cleanText(value || 'Unknown');
}

async function fetchBytes(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Map source request failed (${response.status}) for ${url}`);
    return await response.arrayBuffer();
  } finally {
    clearTimeout(timeout);
  }
}

async function loadIndiaGeoData() {
  const [shpBuffer, dbfBuffer] = await Promise.all([
    fetchBytes(MAP_SOURCE_URLS.shp),
    fetchBytes(MAP_SOURCE_URLS.dbf),
  ]);
  const properties = parseDbf(dbfBuffer);
  const geometries = parseShp(shpBuffer);
  const features = geometries.map((geometry, index) => {
    if (!geometry) return null;
    const props = properties[index] || {};
    return {
      ...geometry,
      properties: {
        ...props,
        ST_NM: pickStateName(props),
      },
    };
  }).filter(Boolean);

  return {
    type: 'FeatureCollection',
    features,
    source: MAP_SOURCE_META,
  };
}

async function getIndiaGeometry() {
  if (cache) return cache;
  if (!loadPromise) {
    loadPromise = loadIndiaGeoData()
      .then((geometry) => {
        cache = geometry;
        return geometry;
      })
      .catch((error) => {
        console.warn(`Primary India Geodata map source unavailable: ${error.message}`);
        const fallback = JSON.parse(fs.readFileSync(LOCAL_STATE_TOPOJSON, 'utf8'));
        return {
          type: 'FeatureCollection',
          features: [],
          topology: fallback,
          source: {
            source: 'Bundled state/UT TopoJSON fallback',
            repository: MAP_SOURCE_META.repository,
            licence: MAP_SOURCE_META.licence,
            fallback: true,
          },
        };
      });
  }
  return loadPromise;
}

router.get('/india', withCache(async () => {
  return getIndiaGeometry();
}, 86400));

router.get('/state-points', withCache(async (req) => {
  if (!req.query.state) {
    throw new Error('Invalid state: a state or union territory is required for the state map');
  }
  return getSpatialCells(req.query);
}, 300));

module.exports = router;
