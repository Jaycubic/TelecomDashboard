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

type ViewMode = 'compare' | 'Airtel' | 'Jio';

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

  const viewMode: ViewMode =
    carrierVisibility.Airtel && carrierVisibility.Jio ? 'compare' :
    carrierVisibility.Airtel ? 'Airtel' : 'Jio';

  const setView = (mode: ViewMode) => {
    if (mode === 'compare') onCarrierVisibilityChange({ Airtel: true, Jio: true });
    else onCarrierVisibilityChange({ Airtel: mode === 'Airtel', Jio: mode === 'Jio' });
  };

  const isFiltered =
    selectedState !== undefined ||
    yearRange[0] !== yearMin ||
    yearRange[1] !== yearMax ||
    viewMode !== 'compare';

  const resetAll = () => {
    onStateChange(undefined);
    onYearRangeChange([yearMin, yearMax]);
    setView('compare');
  };

  return (
    <div className="filterbar" role="region" aria-label="Dashboard filters">
      <div className="filterbar__inner">
        <div className="filterbar__group filterbar__group--operator">
          <span className="filterbar__eyebrow">Network view</span>
          <div className="operator-toggle" role="group" aria-label="Choose a comparison or single-network view">
            <button type="button" className={`operator-toggle__btn ${viewMode === 'compare' ? 'is-active operator-toggle__btn--compare' : ''}`} aria-pressed={viewMode === 'compare'} onClick={() => setView('compare')}>
              <span className="operator-toggle__compare-dots"><i /><i /></span>
              Compare Airtel + Jio
            </button>
            {(['Airtel', 'Jio'] as const).map((operator) => (
              <button
                key={operator}
                type="button"
                className={`operator-toggle__btn operator-toggle__btn--${operator.toLowerCase()} ${viewMode === operator ? 'is-active' : ''}`}
                aria-pressed={viewMode === operator}
                onClick={() => setView(operator)}
              >
                <span aria-hidden="true" />
                {operator} only
              </button>
            ))}
          </div>
        </div>

        <div className="filterbar__field">
          <label className="filterbar__eyebrow" htmlFor="loc-select">State</label>
          <select id="loc-select" value={selectedState ?? ''} onChange={(e) => onStateChange(e.target.value === '' ? undefined : e.target.value)}>
            <option value="">All India</option>
            {(filterOptions?.states ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="filterbar__field">
          <span className="filterbar__eyebrow">Years</span>
          <div className="year-fields">
            <select aria-label="Start year" value={yearRange[0]} onChange={(e) => onYearRangeChange([Math.min(Number(e.target.value), yearRange[1]), yearRange[1]])}>
              {Array.from({ length: Math.max(0, yearMax - yearMin + 1) }, (_, i) => yearMin + i).map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
            <span className="year-fields__dash">—</span>
            <select aria-label="End year" value={yearRange[1]} onChange={(e) => onYearRangeChange([yearRange[0], Math.max(Number(e.target.value), yearRange[0])])}>
              {Array.from({ length: Math.max(0, yearMax - yearMin + 1) }, (_, i) => yearMin + i).map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
        </div>

        <button type="button" className="filterbar__reset" onClick={resetAll} disabled={!isFiltered}>Reset</button>
      </div>
    </div>
  );
}
