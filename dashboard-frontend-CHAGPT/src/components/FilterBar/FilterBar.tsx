import type { FilterOptionsResponse } from '../../types';
import type { CarrierVisibility } from '../../hooks/useDashboardState';
import './FilterBar.css';

interface FilterBarProps {
  selectedState: string | undefined;
  onStateChange: (state: string | undefined) => void;
  yearRange: [number, number];
  onYearRangeChange: (range: [number, number]) => void;
  carrierVisibility: CarrierVisibility;
  onCarrierVisibilityChange: (value: CarrierVisibility) => void;
  filterOptions: FilterOptionsResponse | null;
}

export function FilterBar({
  selectedState,
  onStateChange,
  yearRange,
  onYearRangeChange,
  carrierVisibility,
  onCarrierVisibilityChange,
  filterOptions,
}: FilterBarProps) {
  const years = filterOptions
    ? Array.from({ length: filterOptions.year_max - filterOptions.year_min + 1 }, (_, i) => filterOptions.year_max - i)
    : [2025, 2024, 2023, 2022, 2021];

  const reset = () => {
    onStateChange(undefined);
    const min = filterOptions?.year_min ?? 2021;
    const max = filterOptions?.year_max ?? 2025;
    onYearRangeChange([min, max]);
    onCarrierVisibilityChange({ Airtel: true, Jio: true });
  };

  const bothOperators = carrierVisibility.Airtel && carrierVisibility.Jio;

  return (
    <section className="filterbar" aria-label="Dashboard filters">
      <div className="filterbar__inner">
        <div className="filterbar__group filterbar__group--operator">
          <span className="filterbar__eyebrow">Compare</span>
          <div className="operator-toggle" role="group" aria-label="Operators">
            {(['Airtel', 'Jio'] as const).map((operator) => (
              <button
                key={operator}
                type="button"
                className={`operator-toggle__btn operator-toggle__btn--${operator.toLowerCase()} ${carrierVisibility[operator] ? 'is-active' : ''}`}
                aria-pressed={carrierVisibility[operator]}
                onClick={() => {
                  const next = { ...carrierVisibility, [operator]: !carrierVisibility[operator] };
                  if (!next.Airtel && !next.Jio) return;
                  onCarrierVisibilityChange(next);
                }}
              >
                <span /> {operator}
              </button>
            ))}
          </div>
        </div>

        <label className="filterbar__field">
          <span className="filterbar__eyebrow">State</span>
          <select value={selectedState ?? ''} onChange={(e) => onStateChange(e.target.value || undefined)}>
            <option value="">All India</option>
            {filterOptions?.states.map((state) => <option key={state} value={state}>{state}</option>)}
          </select>
        </label>

        <div className="filterbar__group">
          <span className="filterbar__eyebrow">Years</span>
          <div className="year-fields">
            <select
              aria-label="Start year"
              value={yearRange[0]}
              onChange={(e) => onYearRangeChange([Math.min(Number(e.target.value), yearRange[1]), yearRange[1]])}
            >
              {years.slice().reverse().map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
            <span>—</span>
            <select
              aria-label="End year"
              value={yearRange[1]}
              onChange={(e) => onYearRangeChange([yearRange[0], Math.max(Number(e.target.value), yearRange[0])])}
            >
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
        </div>

        <button type="button" className="filterbar__reset" onClick={reset} disabled={bothOperators && !selectedState && filterOptions ? yearRange[0] === filterOptions.year_min && yearRange[1] === filterOptions.year_max : false}>
          Reset
        </button>
      </div>
    </section>
  );
}
