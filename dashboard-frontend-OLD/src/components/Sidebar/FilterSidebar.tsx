// src/components/Sidebar/FilterSidebar.tsx
import type { FilterOptionsResponse, Region } from '../../types';
import { REGIONS, OPERATOR_COLOR } from '../../lib/constants';
import type { CarrierVisibility } from '../../hooks/useDashboardState';
import './FilterSidebar.css';

interface FilterSidebarProps {
  region: Region | undefined;
  onRegionChange: (region: Region | undefined) => void;
  selectedState: string | undefined;
  onStateChange: (state: string | undefined) => void;
  yearRange: [number, number];
  onYearRangeChange: (range: [number, number]) => void;
  carrierVisibility: CarrierVisibility;
  onCarrierVisibilityChange: (visibility: CarrierVisibility) => void;
  filterOptions: FilterOptionsResponse | null;
}

export function FilterSidebar({
  region,
  onRegionChange,
  selectedState,
  onStateChange,
  yearRange,
  onYearRangeChange,
  carrierVisibility,
  onCarrierVisibilityChange,
  filterOptions,
}: FilterSidebarProps) {
  const yearMin = filterOptions?.year_min ?? 2021;
  const yearMax = filterOptions?.year_max ?? 2025;

  const handleStartYear = (value: number) => {
    onYearRangeChange([Math.min(value, yearRange[1]), yearRange[1]]);
  };
  const handleEndYear = (value: number) => {
    onYearRangeChange([yearRange[0], Math.max(value, yearRange[0])]);
  };

  const toggleCarrier = (carrier: 'Airtel' | 'Jio') => {
    const next = { ...carrierVisibility, [carrier]: !carrierVisibility[carrier] };
    // never allow both to be switched off -- there'd be nothing left to look at
    if (!next.Airtel && !next.Jio) return;
    onCarrierVisibilityChange(next);
  };

  return (
    <aside className="sidebar" aria-label="Dashboard filters">
      <h2 className="sidebar__heading">Filters</h2>

      <fieldset className="sidebar__section">
        <legend className="sidebar__label">Region</legend>
        <div className="sidebar__radio-group" role="radiogroup" aria-label="Region">
          <label className="sidebar__radio">
            <input
              type="radio"
              name="region"
              checked={region === undefined}
              onChange={() => onRegionChange(undefined)}
            />
            All India
          </label>
          {REGIONS.map((r) => (
            <label className="sidebar__radio" key={r}>
              <input
                type="radio"
                name="region"
                checked={region === r}
                onChange={() => onRegionChange(r)}
              />
              {r}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="sidebar__section">
        <label className="sidebar__label" htmlFor="state-select">
          State
        </label>
        <select
          id="state-select"
          className="sidebar__select"
          value={selectedState ?? ''}
          onChange={(e) => onStateChange(e.target.value === '' ? undefined : e.target.value)}
        >
          <option value="">All states</option>
          {(filterOptions?.states ?? []).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="sidebar__section">
        <span className="sidebar__label" id="year-range-label">
          Year range
        </span>
        <div className="sidebar__year-readout tabular">
          {yearRange[0]} — {yearRange[1]}
        </div>
        <div className="sidebar__range-group" aria-labelledby="year-range-label">
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
        <div className="sidebar__range-endpoints tabular">
          <span>{yearMin}</span>
          <span>{yearMax}</span>
        </div>
      </div>

      <div className="sidebar__section">
        <span className="sidebar__label">Carrier</span>
        <div className="sidebar__carrier-group">
          {(['Airtel', 'Jio'] as const).map((carrier) => (
            <label className="sidebar__carrier" key={carrier}>
              <input
                type="checkbox"
                checked={carrierVisibility[carrier]}
                onChange={() => toggleCarrier(carrier)}
              />
              <span
                className="sidebar__carrier-swatch"
                style={{ background: OPERATOR_COLOR[carrier] }}
                aria-hidden="true"
              />
              {carrier}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
