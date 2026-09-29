import { geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import topologyRaw from '../data/india-states-topo.json';
import { normalizeAreaName } from './stateNameMap';

/**
 * State/UT geometry used by the dashboard.
 *
 * Primary geometry now comes from the India Geodata Admin2 state/UT layer
 * served by the backend as GeoJSON. The bundled TopoJSON is retained only as
 * an offline fallback so the D3/SVG dashboard stays usable if that source is
 * temporarily unavailable. No district geometry is used by the renderer.
 */
export interface StateFeature {
  type: 'Feature';
  properties: { ST_NM: string; [key: string]: unknown };
  geometry: GeoJSON.Geometry;
}

const fallbackTopology = topologyRaw as unknown as Topology<{
  [key: string]: GeometryCollection<{ ST_NM: string }>;
}>;

export const INDIA_STATE_FEATURES: StateFeature[] = decodeStateFeatures(fallbackTopology);

function extractFeatureCollection(raw: unknown): Array<{
  type: 'Feature';
  properties?: Record<string, unknown> | null;
  geometry: GeoJSON.Geometry;
}> {
  if (!raw || typeof raw !== 'object') return [];
  const candidate = raw as { type?: string; features?: unknown; state_features?: unknown };
  const source = Array.isArray(candidate.features)
    ? candidate.features
    : Array.isArray(candidate.state_features)
      ? candidate.state_features
      : [];
  return source.filter((item): item is { type: 'Feature'; properties?: Record<string, unknown> | null; geometry: GeoJSON.Geometry } => {
    if (!item || typeof item !== 'object') return false;
    const value = item as { type?: string; geometry?: unknown };
    return value.type === 'Feature' && Boolean(value.geometry);
  });
}

function normalizeFeatures(features: Array<{
  type: 'Feature';
  properties?: Record<string, unknown> | null;
  geometry: GeoJSON.Geometry;
}>): StateFeature[] {
  return features
    .map((item) => ({
      type: 'Feature' as const,
      properties: {
        ...(item.properties ?? {}),
        ST_NM: normalizeAreaName(
          String(item.properties?.ST_NM
            ?? item.properties?.st_nm
            ?? item.properties?.STNAME
            ?? item.properties?.STATE_NAME
            ?? item.properties?.NAME_1
            ?? item.properties?.NAME
            ?? item.properties?.name
            ?? 'Unknown'),
        ),
      },
      geometry: item.geometry,
    }))
    .filter((item) => item.properties.ST_NM !== 'Unknown');
}

export function decodeStateFeatures(rawTopology: unknown): StateFeature[] {
  if (!rawTopology || typeof rawTopology !== 'object') return [];

  const direct = extractFeatureCollection(rawTopology);
  if (direct.length) return normalizeFeatures(direct);

  const topology = rawTopology as Topology<Record<string, GeometryCollection<Record<string, unknown>>>>;
  const objects = topology.objects ?? {};
  const objectKey = Object.keys(objects).find((key) => key.toLowerCase().includes('state'));
  if (!objectKey) return [];

  const decoded = feature(topology, objects[objectKey] as never) as unknown as {
    type: 'FeatureCollection';
    features: Array<{
      type: 'Feature';
      properties?: Record<string, unknown> | null;
      geometry: GeoJSON.Geometry;
    }>;
  };

  return normalizeFeatures(decoded.features);
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
