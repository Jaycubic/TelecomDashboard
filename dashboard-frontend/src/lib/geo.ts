import { geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import topologyRaw from '../data/india-states-topo.json';
import { normalizeAreaName } from './stateNameMap';
import { states as vardhanStates } from 'vardhan-maps/data';

export interface StateFeature {
  type: 'Feature';
  properties: { ST_NM: string };
  geometry: GeoJSON.Geometry;
}

const fallbackTopology = topologyRaw as unknown as Topology<{
  [key: string]: GeometryCollection<{ ST_NM: string }>;
}>;
const VARDHAN_STATE_FEATURES: StateFeature[] = (() => {
  try {
    const collection = vardhanStates as unknown as {
      type: 'FeatureCollection';
      features: Array<{ type: 'Feature'; properties?: Record<string, unknown> | null; geometry: GeoJSON.Geometry }>;
    };
    return (collection.features ?? []).map((item) => ({
      type: 'Feature',
      properties: {
        ST_NM: normalizeAreaName(String(item.properties?.name ?? item.properties?.NAME_1 ?? item.properties?.ST_NM ?? 'Unknown')),
      },
      geometry: item.geometry,
    }));
  } catch {
    return [];
  }
})();

// Prefer Vardhan's current 36-state/UT catalogue. Keep the bundled legacy
// topology as a defensive fallback so the map remains usable if the package
// data ever fails to load. Vardhan's package documents states as eager, light
// weight GeoJSON while districts are lazy; we intentionally use only states/UTs.
export const INDIA_STATE_FEATURES: StateFeature[] = VARDHAN_STATE_FEATURES.length >= 30
  ? VARDHAN_STATE_FEATURES
  : decodeStateFeatures(fallbackTopology);

export function decodeStateFeatures(rawTopology: unknown): StateFeature[] {
  if (!rawTopology || typeof rawTopology !== 'object') return [];

  // Accept either standard GeoJSON FeatureCollection (Vardhan API payload) or
  // the legacy TopoJSON fallback used by older deployments.
  const maybeGeoJson = rawTopology as { type?: string; features?: Array<{ type: 'Feature'; properties?: Record<string, unknown> | null; geometry: GeoJSON.Geometry }> };
  if (maybeGeoJson.type === 'FeatureCollection' && Array.isArray(maybeGeoJson.features)) {
    return maybeGeoJson.features.map((item) => ({
      type: 'Feature',
      properties: {
        ST_NM: normalizeAreaName(String(item.properties?.name ?? item.properties?.ST_NM ?? item.properties?.NAME_1 ?? 'Unknown')),
      },
      geometry: item.geometry,
    }));
  }

  const topology = rawTopology as Topology<Record<string, GeometryCollection<Record<string, unknown>>>>;
  const objects = topology.objects ?? {};
  const objectKey = Object.keys(objects).find((key) => key.toLowerCase().includes('state')) ?? Object.keys(objects)[0];
  if (!objectKey) return [];

  const decoded = feature(topology, objects[objectKey] as never) as unknown as {
    type: 'FeatureCollection';
    features: Array<{ type: 'Feature'; properties?: Record<string, unknown> | null; geometry: GeoJSON.Geometry }>;
  };

  return decoded.features.map((item) => ({
    type: 'Feature',
    properties: {
      ST_NM: normalizeAreaName(
        String(item.properties?.ST_NM ?? item.properties?.st_nm ?? item.properties?.NAME_1 ?? item.properties?.name ?? 'Unknown'),
      ),
    },
    geometry: item.geometry,
  }));
}

export function buildProjection(width: number, height: number, features: StateFeature[] = INDIA_STATE_FEATURES) {
  const featureCollection = {
    type: 'FeatureCollection' as const,
    features,
  };
  const projection = geoMercator().fitSize([width, height], featureCollection as GeoJSON.FeatureCollection);
  const path = geoPath(projection);
  return { projection, path };
}
