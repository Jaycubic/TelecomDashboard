// src/hooks/useDashboardState.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../lib/api';
import type {
  ConfidenceResponse,
  FilterOptionsResponse,
  GlobalFilters,
  IndoorOutdoorResponse,
  KpiResponse,
  Operator,
  RadarResponse,
  StateQualityResponse,
} from '../types';

export interface CarrierVisibility {
  Airtel: boolean;
  Jio: boolean;
}

interface DashboardData {
  kpis: KpiResponse | null;
  stateQuality: StateQualityResponse | null;
  confidence: ConfidenceResponse | null;
  radarAirtel: RadarResponse | null;
  radarJio: RadarResponse | null;
  indoorOutdoor: IndoorOutdoorResponse | null;
  filterOptions: FilterOptionsResponse | null;
}

const EMPTY_DATA: DashboardData = {
  kpis: null,
  stateQuality: null,
  confidence: null,
  radarAirtel: null,
  radarJio: null,
  indoorOutdoor: null,
  filterOptions: null,
};

// NOTE: the Region filter was removed from the UI (it fragmented the
// comparison without adding much the state filter + map click didn't
// already cover). GlobalFilters.region is left in the shared type because
// the backend API still accepts it -- we simply never set it from here.
export function useDashboardState() {
  const [selectedState, setSelectedState] = useState<string | undefined>(undefined);
  const [yearRange, setYearRange] = useState<[number, number]>([2021, 2025]);
  const [carrierVisibility, setCarrierVisibility] = useState<CarrierVisibility>({
    Airtel: true,
    Jio: true,
  });

  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const filters: GlobalFilters = {
    state: selectedState,
    year_start: yearRange[0],
    year_end: yearRange[1],
  };

  // Fetch filter options once -- feeds the location dropdown and sets the
  // year range's real min/max instead of hardcoding 2021-2025.
  useEffect(() => {
    api
      .getFilterOptions()
      .then((opts) => {
        setData((prev) => ({ ...prev, filterOptions: opts }));
        setYearRange([opts.year_min, opts.year_max]);
      })
      .catch((err) => {
        console.error('Failed to load filter options:', err);
      });
  }, []);

  const refetch = useCallback(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    Promise.all([
      api.getKpis(filters),
      api.getStateQuality(filters),
      api.getStateConfidence({}),
      api.getRadar('Airtel' as Operator, filters),
      api.getRadar('Jio' as Operator, filters),
      api.getIndoorOutdoor(filters),
    ])
      .then(([kpis, stateQuality, confidence, radarAirtel, radarJio, indoorOutdoor]) => {
        if (requestId !== requestIdRef.current) return; // a newer request superseded this one
        setData((prev) => ({
          ...prev,
          kpis,
          stateQuality,
          confidence,
          radarAirtel,
          radarJio,
          indoorOutdoor,
        }));
      })
      .catch((err) => {
        if (requestId !== requestIdRef.current) return;
        const message =
          err instanceof ApiError
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
    refetch();
  }, [refetch]);

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
