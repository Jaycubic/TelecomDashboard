// src/components/FilterBar/FilterBar.tsx
// Compact single-row filter strip. No sidebar, no modal.
import type { FilterOptionsResponse } from '../../types';
import type { CarrierVisibility } from '../../hooks/useDashboardState';
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

  const handleStartYear = (v: number) => onYearRangeChange([Math.min(v, yearRange[1]), yearRange[1]]);
  const handleEndYear   = (v: number) => onYearRangeChange([yearRange[0], Math.max(v, yearRange[0])]);

  const compareMode: CompareMode =
    carrierVisibility.Airtel && carrierVisibility.Jio ? 'both' :
    carrierVisibility.Airtel ? 'Airtel' : 'Jio';

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
    <div className="filterbar" role="region" aria-label="Dashboard filters">
      <div className="filterbar__inner">

        {/* Operator toggle */}
        <div className="filterbar__group">
          <span className="filterbar__label">View</span>
          <div className="filterbar__chips" role="group" aria-label="Select operator comparison">
            {(['both', 'Airtel', 'Jio'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`filterbar__chip ${compareMode === mode ? 'filterbar__chip--active' : ''}`}
                aria-pressed={compareMode === mode}
                onClick={() => setCompare(mode)}
              >
                {mode !== 'Jio' && (
                  <span className="filterbar__chip-dot filterbar__chip-dot--airtel" aria-hidden="true" />
                )}
                {mode !== 'Airtel' && (
                  <span className="filterbar__chip-dot filterbar__chip-dot--jio" aria-hidden="true" />
                )}
                {mode === 'both' ? 'Both' : mode}
              </button>
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="filterbar__sep" aria-hidden="true" />

        {/* State */}
        <div className="filterbar__group">
          <label className="filterbar__label" htmlFor="loc-select">State</label>
          <select
            id="loc-select"
            className="filterbar__select"
            value={selectedState ?? ''}
            onChange={(e) => onStateChange(e.target.value === '' ? undefined : e.target.value)}
          >
            <option value="">All India</option>
            {(filterOptions?.states ?? []).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Separator */}
        <div className="filterbar__sep" aria-hidden="true" />

        {/* Year range */}
        <div className="filterbar__group">
          <label className="filterbar__label">Years</label>
          <div className="filterbar__year-group">
            <span className="filterbar__year-val tabular">{yearRange[0]}</span>
            <div className="filterbar__year-sliders">
              <input
                type="range" min={yearMin} max={yearMax} value={yearRange[0]}
                className="filterbar__range"
                aria-label="Start year"
                onChange={(e) => handleStartYear(Number(e.target.value))}
              />
              <input
                type="range" min={yearMin} max={yearMax} value={yearRange[1]}
                className="filterbar__range"
                aria-label="End year"
                onChange={(e) => handleEndYear(Number(e.target.value))}
              />
            </div>
            <span className="filterbar__year-val tabular">{yearRange[1]}</span>
          </div>
        </div>

        {/* Reset */}
        {isFiltered && (
          <>
            <div className="filterbar__sep" aria-hidden="true" />
            <button type="button" className="filterbar__reset" onClick={resetAll}>
              Clear filters
            </button>
          </>
        )}
      </div>
    </div>
  );
}
