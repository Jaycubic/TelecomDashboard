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
  SpatialCellsResponse,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const DEFAULT_CACHE_TTL = 30_000;
const FILTER_CACHE_TTL = 10 * 60_000;
const MAX_MEMORY_ENTRIES = 80;

type CacheEntry = { value: unknown; expiresAt: number; touchedAt: number };
const memoryCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

export class ApiError extends Error {
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

function trimMemoryCache() {
  if (memoryCache.size <= MAX_MEMORY_ENTRIES) return;
  const entries = [...memoryCache.entries()].sort((a, b) => a[1].touchedAt - b[1].touchedAt);
  for (const [key] of entries.slice(0, Math.max(1, entries.length - MAX_MEMORY_ENTRIES))) memoryCache.delete(key);
}

async function getJson<T>(path: string, options: { signal?: AbortSignal; ttlMs?: number; force?: boolean } = {}): Promise<T> {
  const { signal, ttlMs = DEFAULT_CACHE_TTL, force = false } = options;
  const now = Date.now();

  if (!force) {
    const cached = memoryCache.get(path);
    if (cached && cached.expiresAt > now) {
      cached.touchedAt = now;
      return cached.value as T;
    }
    if (cached) memoryCache.delete(path);
  }

  const existing = inflight.get(path);
  if (existing && !force) {
    return raceWithAbort(existing as Promise<T>, signal);
  }

  const request = fetch(`${BASE_URL}${path}`, {
    signal,
    headers: { Accept: 'application/json' },
  })
    .then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new ApiError(body.error ?? `Request failed: ${path}`, res.status);
      }
      return res.json() as Promise<T>;
    })
    .then((value) => {
      memoryCache.set(path, { value, expiresAt: Date.now() + ttlMs, touchedAt: Date.now() });
      trimMemoryCache();
      return value;
    })
    .finally(() => {
      if (inflight.get(path) === request) inflight.delete(path);
    });

  inflight.set(path, request);
  return raceWithAbort(request, signal);
}

function raceWithAbort<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(new DOMException('The request was aborted.', 'AbortError'));
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new DOMException('The request was aborted.', 'AbortError'));
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}

export function clearApiMemoryCache(prefix?: string) {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) if (key.includes(prefix)) memoryCache.delete(key);
}

export function warmApiCache(path: string) {
  return getJson(path).catch(() => undefined);
}

function makeWsUrl() {
  const configured = import.meta.env.VITE_WS_URL;
  if (configured) return configured as string;
  if (typeof window === 'undefined') return null;
  try {
    const url = new URL(BASE_URL || window.location.origin, window.location.origin);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = '/ws';
    url.search = '';
    return url.toString();
  } catch {
    return null;
  }
}

export function subscribeToDashboardUpdates(onRefresh: () => void) {
  if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return () => undefined;
  const wsUrl = makeWsUrl();
  if (!wsUrl) return () => undefined;

  let stopped = false;
  let socket: WebSocket | null = null;
  let retryTimer: number | undefined;
  let backoff = 1000;

  const connect = () => {
    if (stopped) return;
    try {
      socket = new WebSocket(wsUrl);
      socket.onopen = () => { backoff = 1000; };
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message?.type === 'dashboard:refresh') {
            clearApiMemoryCache();
            onRefresh();
          }
        } catch {
          // Ignore non-JSON websocket messages.
        }
      };
      socket.onclose = () => {
        if (stopped) return;
        retryTimer = window.setTimeout(connect, backoff);
        backoff = Math.min(backoff * 2, 15_000);
      };
      socket.onerror = () => socket?.close();
    } catch {
      retryTimer = window.setTimeout(connect, backoff);
      backoff = Math.min(backoff * 2, 15_000);
    }
  };

  connect();
  return () => {
    stopped = true;
    if (retryTimer) window.clearTimeout(retryTimer);
    socket?.close();
  };
}

export const api = {
  getKpis: (filters: GlobalFilters, signal?: AbortSignal, force = false) =>
    getJson<KpiResponse>(`/api/kpis${toQueryString(filters)}`, { signal, force }),

  getStateQuality: (filters: GlobalFilters, signal?: AbortSignal, force = false) =>
    getJson<StateQualityResponse>(`/api/state-quality${toQueryString(filters)}`, { signal, force }),

  getStateConfidence: (filters: GlobalFilters, signal?: AbortSignal, force = false) =>
    getJson<ConfidenceResponse>(`/api/state-quality/confidence${toQueryString(filters)}`, { signal, force }),

  getRadar: (operator: Operator, filters: GlobalFilters, signal?: AbortSignal, force = false) =>
    getJson<RadarResponse>(`/api/radar/${operator}${toQueryString(filters)}`, { signal, force }),

  getIndoorOutdoor: (filters: GlobalFilters, signal?: AbortSignal, force = false) =>
    getJson<IndoorOutdoorResponse>(`/api/indoor-outdoor${toQueryString(filters)}`, { signal, force }),

  getTrend: (filters: GlobalFilters, signal?: AbortSignal, force = false) =>
    getJson<TrendResponse>(`/api/trend${toQueryString(filters)}`, { signal, force }),

  getFilterOptions: (signal?: AbortSignal) =>
    getJson<FilterOptionsResponse>('/api/filters/options', { signal, ttlMs: FILTER_CACHE_TTL }),

  getIndiaMap: (signal?: AbortSignal) =>
    getJson<MapTopologyResponse>('/api/map/india', { signal, ttlMs: 24 * 60 * 60_000 }),

  getStateMapPoints: (filters: GlobalFilters, signal?: AbortSignal, force = false) =>
    getJson<SpatialCellsResponse>(`/api/map/state-points${toQueryString(filters)}`, { signal, ttlMs: 60_000, force }),
};
