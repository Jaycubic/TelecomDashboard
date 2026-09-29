// src/types.ts
// Mirrors the JSON shapes returned by dashboard-backend/api/services/queries.js.
// Numeric fields come back from Postgres as strings for BIGINT/NUMERIC via
// node-pg unless cast; treat total_reports etc. as `string | number` and
// coerce on read rather than assuming the backend always sends a number.

export type Operator = 'Airtel' | 'Jio';
export type Region = 'North' | 'West' | 'East' | 'South';
export type InOut = 'Indoor' | 'Outdoor';
export type Confidence = 'low' | 'medium' | 'high';

export interface GlobalFilters {
  operator?: Operator;
  region?: Region;
  state?: string;
  inout?: InOut;
  year_start?: number;
  year_end?: number;
}

export interface KpiRow {
  operator: Operator;
  total_reports: string | number;
  avg_rating: string | number | null;
  call_drop_pct: string | number | null;
  poor_voice_pct: string | number | null;
}

export interface KpiResponse {
  filters: GlobalFilters;
  kpis: KpiRow[];
}

export interface StateQualityRow {
  state_name: string;
  region: Region | null;
  operator: Operator;
  total_reports: string | number;
  avg_rating: string | number | null;
  call_drop_pct: string | number | null;
  poor_voice_pct: string | number | null;
  satisfactory_pct?: string | number | null;
  indoor_satisfactory_pct?: string | number | null;
  outdoor_satisfactory_pct?: string | number | null;
}

export interface StateQualityResponse {
  filters: GlobalFilters;
  source: 'materialized_view' | 'live_aggregate';
  states: StateQualityRow[];
}

export interface ConfidenceRow {
  state_name: string;
  operator: Operator;
  total_reports: string | number;
  confidence: Confidence;
}

export interface ConfidenceResponse {
  filters: GlobalFilters;
  confidence: ConfidenceRow[];
}

export interface RadarAxes {
  rating: number | null;
  indoor_quality: number | null;
  outdoor_quality: number | null;
  network_stability: number | null;
  voice_clarity: number | null;
  coverage: number | null;
}

export interface RadarResponse {
  operator: Operator;
  filters: GlobalFilters;
  sample_size: number;
  axes: RadarAxes;
}

export interface IndoorOutdoorRow {
  operator: Operator;
  inout: InOut;
  total_reports: string | number;
  call_drop_pct: string | number | null;
  poor_voice_pct: string | number | null;
  satisfactory_pct: string | number | null;
}

export interface IndoorOutdoorResponse {
  filters: GlobalFilters;
  breakdown: IndoorOutdoorRow[];
}

export interface FilterAreaOption {
  name: string;
  type: 'state' | 'union_territory';
}

export interface FilterOptionsResponse {
  regions: Region[];
  states: string[];
  union_territories: string[];
  areas: FilterAreaOption[];
  year_min: number;
  year_max: number;
  total_records: string | number;
}

export interface TrendPoint {
  operator: Operator;
  year: number;
  month: number | null;
  satisfactory_pct: number | null;
  total_reviews: string | number;
}

export interface TrendResponse {
  filters: GlobalFilters;
  granularity: 'month' | 'year';
  points: TrendPoint[];
}

export interface SpatialCell {
  operator: Operator;
  lat: number | string;
  lon: number | string;
  total_reviews: string | number;
  avg_rating: string | number | null;
  satisfactory_pct: string | number | null;
  call_drop_pct: string | number | null;
  poor_voice_pct: string | number | null;
}

export interface SpatialCellsResponse {
  filters: GlobalFilters;
  granularity: 'cell_0.1_degree' | 'state';
  cells: SpatialCell[];
}

export interface MapTopologyResponse {
  source: string;
  licence?: string;
  topology?: unknown;
  state_features?: unknown;
}
