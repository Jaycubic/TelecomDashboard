import { useMemo, useState } from 'react';
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
type YearMode = 'single' | 'period';

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
  const [yearMode, setYearMode] = useState<YearMode>(yearRange[0] === yearRange[1] ? 'single' : 'period');

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

  const years = useMemo(
    () => Array.from({ length: Math.max(0, yearMax - yearMin + 1) }, (_, i) => yearMin + i),
    [yearMin, yearMax],
  );

  const setYearModeSafe = (mode: YearMode) => {
    setYearMode(mode);
    if (mode === 'single') {
      const current = yearRange[1] || yearMax;
      onYearRangeChange([current, current]);
    } else {
      onYearRangeChange([yearMin, yearMax]);
    }
  };

  const resetAll = () => {
    onStateChange(undefined);
    onYearRangeChange([yearMin, yearMax]);
    setYearMode('period');
    setView('compare');
  };

  const updateRange = (nextStart: number, nextEnd: number) => {
    if (nextStart <= nextEnd) onYearRangeChange([nextStart, nextEnd]);
    else onYearRangeChange([nextEnd, nextStart]);
  };

  return (
    <div className="filterbar" role="region" aria-label="Dashboard filters">
      <div className="filterbar__inner">
        <div className="filterbar__group filterbar__group--operator">
          <span className="filterbar__eyebrow">Network view</span>
          <div className="operator-toggle" role="group" aria-label="Choose a network view">
            <button
              type="button"
              className={`operator-toggle__btn operator-toggle__btn--jio ${viewMode === 'Jio' ? 'is-active' : ''}`}
              aria-pressed={viewMode === 'Jio'}
              onClick={() => setView('Jio')}
            >
              <span aria-hidden="true" />
              Jio only
            </button>
            <button
              type="button"
              className={`operator-toggle__btn operator-toggle__btn--airtel ${viewMode === 'Airtel' ? 'is-active' : ''}`}
              aria-pressed={viewMode === 'Airtel'}
              onClick={() => setView('Airtel')}
            >
              <span aria-hidden="true" />
              Airtel only
            </button>
            <button
              type="button"
              className={`operator-toggle__btn ${viewMode === 'compare' ? 'is-active operator-toggle__btn--compare' : ''}`}
              aria-pressed={viewMode === 'compare'}
              onClick={() => setView('compare')}
            >
              <span className="operator-toggle__compare-dots" aria-hidden="true"><i /><i /></span>
              Compare Airtel + Jio
            </button>
          </div>
        </div>

        <div className="filterbar__field filterbar__field--state">
          <label className="filterbar__eyebrow" htmlFor="loc-select">State</label>
          <select id="loc-select" value={selectedState ?? ''} onChange={(e) => onStateChange(e.target.value === '' ? undefined : e.target.value)}>
            <option value="">All India</option>
            {(filterOptions?.states ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="filterbar__field filterbar__field--years">
          <div className="filterbar__years-head">
            <span className="filterbar__eyebrow">Years</span>
            <div className="year-mode" role="group" aria-label="Choose year filtering mode">
              <button type="button" className={yearMode === 'single' ? 'is-active' : ''} onClick={() => setYearModeSafe('single')}>Single year</button>
              <button type="button" className={yearMode === 'period' ? 'is-active' : ''} onClick={() => setYearModeSafe('period')}>Period</button>
            </div>
          </div>

          {yearMode === 'single' ? (
            <div className="single-year-control">
              <input
                type="range"
                min={yearMin}
                max={yearMax}
                step={1}
                value={yearRange[0]}
                aria-label="Select a single year"
                onChange={(e) => {
                  const year = Number(e.target.value);
                  onYearRangeChange([year, year]);
                }}
              />
              <output>{yearRange[0]}</output>
            </div>
          ) : (
            <div className="range-year-control">
              <div className="range-year-values">
                <output>{yearRange[0]}</output>
                <span>to</span>
                <output>{yearRange[1]}</output>
              </div>
              <div className="range-year-track">
                <div
                  className="range-year-track__fill"
                  style={{
                    left: `${((yearRange[0] - yearMin) / Math.max(1, yearMax - yearMin)) * 100}%`,
                    right: `${((yearMax - yearRange[1]) / Math.max(1, yearMax - yearMin)) * 100}%`,
                  }}
                />
                <input
                  type="range"
                  min={yearMin}
                  max={yearMax}
                  step={1}
                  value={yearRange[0]}
                  aria-label="Start year"
                  onChange={(e) => updateRange(Number(e.target.value), yearRange[1])}
                />
                <input
                  type="range"
                  min={yearMin}
                  max={yearMax}
                  step={1}
                  value={yearRange[1]}
                  aria-label="End year"
                  onChange={(e) => updateRange(yearRange[0], Number(e.target.value))}
                />
              </div>
            </div>
          )}
          <div className="year-control-hint">
            {yearMode === 'single' ? 'Check one year at a time; switch years without creating a multi-year average.' : 'Use a period when you want the dashboard to summarize several years together.'}
            <span className="year-control-available" aria-hidden="true">{years[0]}–{years[years.length - 1]}</span>
          </div>
        </div>

        <button type="button" className="filterbar__reset" onClick={resetAll} disabled={!isFiltered}>Reset</button>
      </div>
    </div>
  );
}
