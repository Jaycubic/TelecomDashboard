import { geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import topologyRaw from '../data/india-states-topo.json';
import { normalizeAreaName } from './stateNameMap';

export interface StateFeature {
  type: 'Feature';
  properties: { ST_NM: string };
  geometry: GeoJSON.Geometry;
}

const fallbackTopology = topologyRaw as unknown as Topology<{
  [key: string]: GeometryCollection<{ ST_NM: string }>;
}>;
export const INDIA_STATE_FEATURES: StateFeature[] = decodeStateFeatures(fallbackTopology);

export function decodeStateFeatures(rawTopology: unknown): StateFeature[] {
  if (!rawTopology || typeof rawTopology !== 'object') return [];
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
