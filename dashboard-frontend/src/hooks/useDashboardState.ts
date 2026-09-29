import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError, subscribeToDashboardUpdates, clearApiMemoryCache } from '../lib/api';
import topologyRaw from '../data/india-states-topo.json';
import type {
  ConfidenceResponse,
  FilterOptionsResponse,
  GlobalFilters,
  IndoorOutdoorResponse,
  KpiResponse,
  StateQualityResponse,
  TrendResponse,
  MapTopologyResponse,
  SpatialCellsResponse,
} from '../types';

export interface CarrierVisibility {
  Airtel: boolean;
  Jio: boolean;
}

interface DashboardData {
  kpis: KpiResponse | null;
  stateQuality: StateQualityResponse | null;
  confidence: ConfidenceResponse | null;
  indoorOutdoor: IndoorOutdoorResponse | null;
  trend: TrendResponse | null;
  filterOptions: FilterOptionsResponse | null;
  mapTopology: MapTopologyResponse | null;
  spatialCells: SpatialCellsResponse | null;
}

const EMPTY_DATA: DashboardData = {
  kpis: null,
  stateQuality: null,
  confidence: null,
  indoorOutdoor: null,
  trend: null,
  filterOptions: null,
  mapTopology: null,
  spatialCells: null,
};

const LOCAL_MAP: MapTopologyResponse = { type: topologyRaw.type, topology: topologyRaw, source: { source: 'india-geodata', fallback: false } };

export function useDashboardState() {
  const [selectedState, setSelectedState] = useState<string | undefined>(undefined);
  const [yearRange, setYearRange] = useState<[number, number]>([2017, 2025]);
  const [carrierVisibility, setCarrierVisibility] = useState<CarrierVisibility>({ Airtel: true, Jio: true });
  const [data, setData] = useState<DashboardData>({ ...EMPTY_DATA, mapTopology: LOCAL_MAP });
  const [loading, setLoading] = useState(true);
  const [spatialLoading, setSpatialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const requestIdRef = useRef(0);
  const activeAbortRef = useRef<AbortController | null>(null);
  const refetchRef = useRef<((force?: boolean) => void) | null>(null);

  const filters: GlobalFilters = {
    state: selectedState,
    year_start: Math.min(yearRange[0], yearRange[1]),
    year_end: Math.max(yearRange[0], yearRange[1]),
  };

  // One configuration request, then all map geometry stays local and synchronous.
  useEffect(() => {
    const controller = new AbortController();
    api.getFilterOptions(controller.signal)
      .then((filterOptions) => {
        if (controller.signal.aborted) return;
        setData((prev) => ({ ...prev, filterOptions }));
        setYearRange((current) => {
          if (current[0] === 2017 && current[1] === 2025) return [filterOptions.year_min, filterOptions.year_max];
          return current;
        });
        setInitialized(true);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error('Failed to load dashboard configuration:', err);
        setError(err instanceof ApiError ? `${err.message} (HTTP ${err.status})` : 'Could not load dashboard filters.');
        setInitialized(true);
      });
    return () => controller.abort();
  }, []);

  const refetch = useCallback((force = false) => {
    if (!initialized) return;
    const requestId = ++requestIdRef.current;
    activeAbortRef.current?.abort();
    const controller = new AbortController();
    activeAbortRef.current = controller;

    setLoading(true);
    setError(null);

    const baseFilters: GlobalFilters = {
      state: selectedState,
      year_start: Math.min(yearRange[0], yearRange[1]),
      year_end: Math.max(yearRange[0], yearRange[1]),
    };

    const summaryPromise = Promise.all([
      api.getKpis(baseFilters, controller.signal, force),
      api.getStateQuality(baseFilters, controller.signal, force),
      api.getStateConfidence(baseFilters, controller.signal, force),
      api.getIndoorOutdoor(baseFilters, controller.signal, force),
      api.getTrend(baseFilters, controller.signal, force),
    ]);

    const spatialPromise = selectedState
      ? api.getStateMapPoints(baseFilters, controller.signal, force)
      : Promise.resolve(null);

    if (selectedState) setSpatialLoading(true);

    Promise.all([summaryPromise, spatialPromise])
      .then(([[kpis, stateQuality, confidence, indoorOutdoor, trend], spatialCells]) => {
        if (requestId !== requestIdRef.current || controller.signal.aborted) return;
        setData((prev) => ({
          ...prev,
          kpis,
          stateQuality,
          confidence,
          indoorOutdoor,
          trend,
          spatialCells,
        }));
      })
      .catch((err) => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return;
        const message = err instanceof ApiError
          ? `${err.message} (HTTP ${err.status})`
          : 'Could not reach the dashboard API. Is the backend running?';
        setError(message);
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
        setSpatialLoading(false);
      });
  }, [initialized, selectedState, yearRange]);

  useEffect(() => {
    refetchRef.current = refetch;
    return () => { refetchRef.current = null; };
  }, [refetch]);

  useEffect(() => {
    if (!initialized) return;
    refetch(false);
  }, [initialized, refetch]);

  // Redis publishes a lightweight invalidation event after cache refresh.
  // This keeps the browser's short-lived memory cache fresh without polling.
  useEffect(() => subscribeToDashboardUpdates(() => {
    clearApiMemoryCache();
    refetchRef.current?.(true);
  }), []);

  // Operator buttons only change the map's visual filter. Spatial data is fetched
  // once per state/year selection for both operators, so switching Airtel/Jio is instant.
  const setStateAndPrefetch = useCallback((nextState: string | undefined) => {
    setSelectedState(nextState);
    if (!nextState) setData((prev) => ({ ...prev, spatialCells: null }));
  }, []);

  return {
    selectedState,
    setSelectedState: setStateAndPrefetch,
    yearRange,
    setYearRange,
    carrierVisibility,
    setCarrierVisibility,
    data,
    loading,
    spatialLoading,
    error,
    refetch,
  };
}
