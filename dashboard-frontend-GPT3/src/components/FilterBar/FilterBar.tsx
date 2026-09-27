import { useEffect, useMemo, useRef, useState } from 'react';
import type { FilterOptionsResponse } from '../../types';
import type { CarrierVisibility } from '../../hooks/useDashboardState';
import './FilterBar.css';

interface StateSelectProps {
  selectedState: string | undefined;
  states: string[];
  onChange: (state: string | undefined) => void;
}

function StateSelect({ selectedState, states, onChange }: StateSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredStates = useMemo(() => {
    if (!search.trim()) return states;
    const q = search.trim().toLowerCase();
    return states.filter((s) => s.toLowerCase().includes(q));
  }, [states, search]);

  const handleSelect = (state: string | undefined) => {
    onChange(state);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="state-select" ref={containerRef}>
      <button
        id="loc-select"
        type="button"
        className={`state-select__trigger ${isOpen ? 'is-open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Filter by state"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setSearch('');
        }}
      >
        <span className="state-select__label">{selectedState ?? 'All India'}</span>
        <svg
          className={`state-select__chevron ${isOpen ? 'state-select__chevron--open' : ''}`}
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M1 1L5 5L9 1" />
        </svg>
      </button>

      {isOpen && (
        <div className="state-select__dropdown" role="listbox" aria-label="States list">
          {states.length > 8 && (
            <div className="state-select__search-box">
              <input
                type="text"
                className="state-select__search-input"
                placeholder="Search state..."
                value={search}
                autoFocus
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              {search && (
                <button
                  type="button"
                  className="state-select__search-clear"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          )}

          <div className="state-select__options">
            {(!search || 'all india'.includes(search.toLowerCase())) && (
              <button
                type="button"
                role="option"
                aria-selected={!selectedState}
                className={`state-select__option ${!selectedState ? 'is-selected' : ''}`}
                onClick={() => handleSelect(undefined)}
              >
                <span>All India</span>
                {!selectedState && <span className="state-select__check" aria-hidden="true">✓</span>}
              </button>
            )}

            {filteredStates.map((s) => {
              const isSelected = selectedState === s;
              return (
                <button
                  key={s}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`state-select__option ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => handleSelect(s)}
                >
                  <span>{s}</span>
                  {isSelected && <span className="state-select__check" aria-hidden="true">✓</span>}
                </button>
              );
            })}

            {filteredStates.length === 0 && !('all india'.includes(search.toLowerCase())) && (
              <div className="state-select__empty">No states found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface FilterBarProps {
  selectedState: string | undefined;
  onStateChange: (state: string | undefined) => void;
  yearRange: [number, number];
  onYearRangeChange: (range: [number, number]) => void;
  carrierVisibility: CarrierVisibility;
  onCarrierVisibilityChange: (visibility: CarrierVisibility) => void;
  filterOptions: FilterOptionsResponse | null;
  embedded?: boolean;
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
  embedded = false,
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
    <div className={`filterbar ${embedded ? 'filterbar--embedded' : ''}`} role="region" aria-label="Dashboard filters">
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
          <StateSelect
            selectedState={selectedState}
            states={filterOptions?.states ?? []}
            onChange={onStateChange}
          />
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
            <span>{yearMode === 'single' ? 'Single year' : 'Selected period'}</span>
            <span className="year-control-available" aria-hidden="true">{years[0]}–{years[years.length - 1]}</span>
          </div>
        </div>

        <button type="button" className="filterbar__reset" onClick={resetAll} disabled={!isFiltered}>Reset</button>
      </div>
    </div>
  );
}
