import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../lib/api';
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

export function useDashboardState() {
  const [selectedState, setSelectedState] = useState<string | undefined>(undefined);
  const [yearRange, setYearRange] = useState<[number, number]>([2017, 2025]);
  const [carrierVisibility, setCarrierVisibility] = useState<CarrierVisibility>({ Airtel: true, Jio: true });
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const filters: GlobalFilters = {
    state: selectedState,
    year_start: Math.min(yearRange[0], yearRange[1]),
    year_end: Math.max(yearRange[0], yearRange[1]),
  };

  useEffect(() => {
    Promise.all([api.getFilterOptions(), api.getIndiaMap()])
      .then(([filterOptions, mapTopology]) => {
        setData((prev) => ({ ...prev, filterOptions, mapTopology }));
        setYearRange([filterOptions.year_min, filterOptions.year_max]);
      })
      .catch((err) => {
        console.error('Failed to load dashboard configuration:', err);
        api.getFilterOptions().then((filterOptions) => {
          setData((prev) => ({ ...prev, filterOptions }));
          setYearRange([filterOptions.year_min, filterOptions.year_max]);
        }).catch(() => undefined);
        // The map has a bundled fallback, so a map-source fetch failure is not fatal.
      });
  }, []);

  const refetch = useCallback(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    Promise.all([
      api.getKpis(filters),
      api.getStateQuality(filters),
      api.getStateConfidence(filters),
      api.getIndoorOutdoor(filters),
      api.getTrend(filters),
    ])
      .then(([kpis, stateQuality, confidence, indoorOutdoor, trend]) => {
        if (requestId !== requestIdRef.current) return;
        setData((prev) => ({ ...prev, kpis, stateQuality, confidence, indoorOutdoor, trend }));
      })
      .catch((err) => {
        if (requestId !== requestIdRef.current) return;
        const message = err instanceof ApiError
          ? `${err.message} (HTTP ${err.status})`
          : 'Could not reach the dashboard API. Is the backend running?';
        setError(message);
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState, yearRange[0], yearRange[1]]);

  useEffect(() => {
    if (!selectedState) {
      setData((prev) => ({ ...prev, spatialCells: null }));
      return;
    }

    let cancelled = false;
    const spatialFilters: GlobalFilters = {
      ...filters,
      operator: carrierVisibility.Airtel === carrierVisibility.Jio
        ? undefined
        : carrierVisibility.Airtel
          ? 'Airtel'
          : 'Jio',
    };

    api.getStateMapPoints(spatialFilters)
      .then((spatialCells) => {
        if (!cancelled) setData((prev) => ({ ...prev, spatialCells }));
      })
      .catch((err) => {
        console.error('Failed to load state map points:', err);
        if (!cancelled) setData((prev) => ({ ...prev, spatialCells: null }));
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState, yearRange[0], yearRange[1], carrierVisibility.Airtel, carrierVisibility.Jio]);

  useEffect(() => { refetch(); }, [refetch]);

  return {
    selectedState,
    setSelectedState,
    yearRange,
    setYearRange,
    carrierVisibility,
    setCarrierVisibility,
    data,
    loading,
    error,
    refetch,
  };
}
