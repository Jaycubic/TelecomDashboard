import { useEffect, useMemo, useRef, useState } from 'react';
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
    onCarrierVisibilityChange({ Airtel: true, Jio: true });
  };

  const updateRange = (nextStart: number, nextEnd: number) => {
    if (nextStart <= nextEnd) onYearRangeChange([nextStart, nextEnd]);
    else onYearRangeChange([nextEnd, nextStart]);
  };

  return (
    <div className={`filterbar ${embedded ? 'filterbar--embedded' : ''}`} role="region" aria-label="Dashboard filters">
      <div className="filterbar__inner">
        <StateSelect
          selectedState={selectedState}
          states={filterOptions?.states ?? []}
          onStateChange={onStateChange}
        />

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

function StateSelect({
  selectedState,
  states,
  onStateChange,
}: {
  selectedState: string | undefined;
  states: string[];
  onStateChange: (state: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const options = useMemo(() => ['All India', ...states.filter((state) => state !== 'All India')], [states]);
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.toLowerCase().includes(normalized));
  }, [options, query]);

  const displayValue = selectedState ?? 'All India';

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const choose = (value: string) => {
    onStateChange(value === 'All India' ? undefined : value);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="filterbar__field filterbar__field--state">
      <span className="filterbar__eyebrow">State</span>
      <div className={`state-select ${open ? 'is-open' : ''}`} ref={containerRef}>
        <button
          type="button"
          className="state-select__trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => {
            setOpen((value) => !value);
            setQuery('');
          }}
        >
          <span>{displayValue}</span>
          <span className="state-select__chevron" aria-hidden="true" />
        </button>
        {open && (
          <div className="state-select__menu" role="listbox" aria-label="Choose a state">
            <div className="state-select__search-wrap">
              <input
                ref={inputRef}
                className="state-select__search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search states"
                aria-label="Search states"
                autoComplete="off"
              />
            </div>
            <div className="state-select__options">
              {filteredOptions.length ? filteredOptions.map((option) => {
                const active = option === displayValue;
                return (
                  <button
                    key={option}
                    type="button"
                    className={`state-select__option ${active ? 'is-active' : ''}`}
                    role="option"
                    aria-selected={active}
                    onClick={() => choose(option)}
                  >
                    <span>{option}</span>
                    {active && <span className="state-select__check" aria-hidden="true">✓</span>}
                  </button>
                );
              }) : (
                <div className="state-select__empty">No states found.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
