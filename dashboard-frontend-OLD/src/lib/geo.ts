// src/lib/geo.ts
import { geoMercator, geoPath, type GeoPath, type GeoPermissibleObjects } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import topologyRaw from '../data/india-states-topo.json';

export interface StateFeature {
  type: 'Feature';
  properties: { ST_NM: string };
  geometry: GeoJSON.Geometry;
}

const topology = topologyRaw as unknown as Topology<{
  [key: string]: GeometryCollection<{ ST_NM: string }>;
}>;

const objectKey = Object.keys(topology.objects)[0];

/** All 36 state/UT features, decoded once at module load. */
export const INDIA_STATE_FEATURES: StateFeature[] = (
  feature(topology, topology.objects[objectKey]) as unknown as {
    features: StateFeature[];
  }
).features;

/**
 * Builds a projection fitted to the given pixel box, plus the matching
 * path generator. Recompute on container resize for a responsive map.
 */
export function buildProjection(width: number, height: number) {
  const featureCollection = {
    type: 'FeatureCollection' as const,
    features: INDIA_STATE_FEATURES,
  };
  const projection = geoMercator().fitSize([width, height], featureCollection as GeoJSON.FeatureCollection);
  const path: GeoPath<unknown, GeoPermissibleObjects> = geoPath(projection);
  return { projection, path };
}
