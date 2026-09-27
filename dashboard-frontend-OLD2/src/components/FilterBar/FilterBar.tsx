// src/components/FilterBar/FilterBar.tsx
// Replaces the old left-hand filter sidebar. Region is gone entirely
// (state + map click already cover "where", and Region was one more
// technical axis competing for attention). Everything lives in one
// compact bar so the comparison content starts right under the header.
import type { FilterOptionsResponse } from '../../types';
import type { CarrierVisibility } from '../../hooks/useDashboardState';
import { OPERATOR_COLOR } from '../../lib/constants';
import './FilterBar.css';

interface FilterBarProps {
  selectedState: string | undefined;
  onStateChange: (state: string | undefined) => void;
  yearRange: [number, number];
  onYearRangeChange: (range: [number, number]) => void;
  carrierVisibility: CarrierVisibility;
  onCarrierVisibilityChange: (visibility: CarrierVisibility) => void;
  filterOptions: FilterOptionsResponse | null;
}

type CompareMode = 'both' | 'Airtel' | 'Jio';

export function FilterBar({
  selectedState,
  onStateChange,
  yearRange,
  onYearRangeChange,
  carrierVisibility,
  onCarrierVisibilityChange,
  filterOptions,
}: FilterBarProps) {
  const yearMin = filterOptions?.year_min ?? 2021;
  const yearMax = filterOptions?.year_max ?? 2025;

  const handleStartYear = (value: number) =>
    onYearRangeChange([Math.min(value, yearRange[1]), yearRange[1]]);
  const handleEndYear = (value: number) =>
    onYearRangeChange([yearRange[0], Math.max(value, yearRange[0])]);

  const compareMode: CompareMode =
    carrierVisibility.Airtel && carrierVisibility.Jio ? 'both' : carrierVisibility.Airtel ? 'Airtel' : 'Jio';

  const setCompare = (mode: CompareMode) => {
    if (mode === 'both') onCarrierVisibilityChange({ Airtel: true, Jio: true });
    else onCarrierVisibilityChange({ Airtel: mode === 'Airtel', Jio: mode === 'Jio' });
  };

  const isFiltered =
    selectedState !== undefined ||
    yearRange[0] !== yearMin ||
    yearRange[1] !== yearMax ||
    compareMode !== 'both';

  const resetAll = () => {
    onStateChange(undefined);
    onYearRangeChange([yearMin, yearMax]);
    setCompare('both');
  };

  return (
    <div className="filter-bar" role="region" aria-label="Dashboard filters">
      <div className="filter-bar__group">
        <span className="filter-bar__label" id="compare-label">
          Compare
        </span>
        <div className="filter-bar__compare" role="group" aria-labelledby="compare-label">
          {(['both', 'Airtel', 'Jio'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`filter-bar__chip ${compareMode === mode ? 'filter-bar__chip--active' : ''}`}
              aria-pressed={compareMode === mode}
              onClick={() => setCompare(mode)}
            >
              {mode !== 'Jio' && (
                <i className="filter-bar__chip-swatch" style={{ background: OPERATOR_COLOR.Airtel }} />
              )}
              {mode !== 'Airtel' && (
                <i
                  className="filter-bar__chip-swatch filter-bar__chip-swatch--dashed"
                  style={{ background: OPERATOR_COLOR.Jio }}
                />
              )}
              {mode === 'both' ? 'Airtel ↔ Jio' : mode}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-bar__group">
        <label className="filter-bar__label" htmlFor="location-select">
          Location
        </label>
        <select
          id="location-select"
          className="filter-bar__select"
          value={selectedState ?? ''}
          onChange={(e) => onStateChange(e.target.value === '' ? undefined : e.target.value)}
        >
          <option value="">All India</option>
          {(filterOptions?.states ?? []).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <details className="filter-bar__group filter-bar__popover">
        <summary className="filter-bar__summary">
          <span className="filter-bar__label">Time</span>
          <span className="filter-bar__summary-value tabular">
            {yearRange[0]}–{yearRange[1]}
          </span>
        </summary>
        <div className="filter-bar__popover-body">
          <div className="filter-bar__range-group" aria-label="Year range">
            <label className="sr-only" htmlFor="year-start">
              Start year
            </label>
            <input
              id="year-start"
              type="range"
              min={yearMin}
              max={yearMax}
              value={yearRange[0]}
              onChange={(e) => handleStartYear(Number(e.target.value))}
            />
            <label className="sr-only" htmlFor="year-end">
              End year
            </label>
            <input
              id="year-end"
              type="range"
              min={yearMin}
              max={yearMax}
              value={yearRange[1]}
              onChange={(e) => handleEndYear(Number(e.target.value))}
            />
          </div>
          <div className="filter-bar__range-endpoints tabular">
            <span>{yearMin}</span>
            <span>{yearMax}</span>
          </div>
        </div>
      </details>

      {isFiltered && (
        <button type="button" className="filter-bar__reset" onClick={resetAll}>
          Reset filters
        </button>
      )}
    </div>
  );
}
