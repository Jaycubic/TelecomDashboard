// src/lib/api.ts
import type {
  ConfidenceResponse,
  FilterOptionsResponse,
  GlobalFilters,
  IndoorOutdoorResponse,
  KpiResponse,
  Operator,
  RadarResponse,
  StateQualityResponse,
  TrendResponse,
  MapTopologyResponse,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

function toQueryString(filters: GlobalFilters): string {
  const params = new URLSearchParams();
  if (filters.operator) params.set('operator', filters.operator);
  if (filters.region) params.set('region', filters.region);
  if (filters.state) params.set('state', filters.state);
  if (filters.inout) params.set('inout', filters.inout);
  if (filters.year_start !== undefined) params.set('year_start', String(filters.year_start));
  if (filters.year_end !== undefined) params.set('year_end', String(filters.year_end));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(body.error ?? `Request failed: ${path}`, res.status);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getKpis: (filters: GlobalFilters) =>
    getJson<KpiResponse>(`/api/kpis${toQueryString(filters)}`),

  getStateQuality: (filters: GlobalFilters) =>
    getJson<StateQualityResponse>(`/api/state-quality${toQueryString(filters)}`),

  getStateConfidence: (filters: GlobalFilters) =>
    getJson<ConfidenceResponse>(`/api/state-quality/confidence${toQueryString(filters)}`),

  getRadar: (operator: Operator, filters: GlobalFilters) =>
    getJson<RadarResponse>(`/api/radar/${operator}${toQueryString(filters)}`),

  getIndoorOutdoor: (filters: GlobalFilters) =>
    getJson<IndoorOutdoorResponse>(`/api/indoor-outdoor${toQueryString(filters)}`),

  getTrend: (filters: GlobalFilters) =>
    getJson<TrendResponse>(`/api/trend${toQueryString(filters)}`),

  getFilterOptions: () => getJson<FilterOptionsResponse>('/api/filters/options'),

  getIndiaMap: () => getJson<MapTopologyResponse>('/api/map/india'),
};

export { ApiError };
