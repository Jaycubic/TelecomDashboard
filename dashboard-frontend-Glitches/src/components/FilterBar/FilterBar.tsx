import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { FilterOptionsResponse } from '../../types';
import { InfoPopover } from '../InfoPopover/InfoPopover';
import './FilterBar.css';

interface FilterBarProps {
  selectedState: string | undefined;
  onStateChange: (state: string | undefined) => void;
  yearRange: [number, number];
  onYearRangeChange: (range: [number, number]) => void;
  filterOptions: FilterOptionsResponse | null;
}

const fallbackStates = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh',
  'Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha',
  'Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
];
const fallbackUts = ['Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'];

export function FilterBar({ selectedState, onStateChange, yearRange, onYearRangeChange, filterOptions }: FilterBarProps) {
  const stateOptions = filterOptions?.states?.length ? filterOptions.states : fallbackStates;
  const unionTerritories = filterOptions?.union_territories?.length ? filterOptions.union_territories : fallbackUts;
  const minYear = filterOptions?.year_min ?? 2017;
  const maxYear = filterOptions?.year_max ?? 2025;
  const low = Math.max(minYear, Math.min(maxYear, Math.min(yearRange[0], yearRange[1])));
  const high = Math.max(minYear, Math.min(maxYear, Math.max(yearRange[0], yearRange[1])));
  const selectedLabel = low === high ? String(low) : `${low}–${high}`;

  const setStart = (value: number) => onYearRangeChange([Math.min(value, high), high]);
  const setEnd = (value: number) => onYearRangeChange([low, Math.max(value, low)]);

  return (
    <div className="filterbar" aria-label="Filters">
      <div className="filterbar__location">
        <LocationSelect
          value={selectedState}
          states={stateOptions}
          unionTerritories={unionTerritories}
          onChange={onStateChange}
        />
      </div>
      <div className="filterbar__years">
        <div className="year-slider__head">
          <span className="year-slider__current">{selectedLabel}</span>
          <InfoPopover label="How to use the year slider">
            <p className="info-popover__title">Timeline</p>
            <p><strong>One year:</strong> place both handles on the same year. The trend below uses monthly source records for that year.</p>
            <p><strong>Several years:</strong> separate the handles. The trend summarizes each year in the selected period.</p>
            <p className="info-popover__note">A year with no recorded reviews is shown as blank in the trend; it is not treated as zero.</p>
          </InfoPopover>
        </div>
        <div className="year-slider" style={{ '--start': `${((low - minYear) / Math.max(1, maxYear - minYear)) * 100}%`, '--end': `${((high - minYear) / Math.max(1, maxYear - minYear)) * 100}%` } as CSSProperties}>
          <div className="year-slider__track" aria-hidden="true"><span /></div>
          <input
            className="year-slider__input year-slider__input--min"
            type="range"
            min={minYear}
            max={maxYear}
            step={1}
            value={low}
            aria-label="Start year"
            onChange={(event) => setStart(Number(event.target.value))}
          />
          <input
            className="year-slider__input year-slider__input--max"
            type="range"
            min={minYear}
            max={maxYear}
            step={1}
            value={high}
            aria-label="End year"
            onChange={(event) => setEnd(Number(event.target.value))}
          />
        </div>
        <div className="year-slider__ends"><span>{minYear}</span><span>{maxYear}</span></div>
      </div>
      <button
        type="button"
        className="filterbar__reset"
        aria-label="Reset location and timeline filters"
        title="Reset filters"
        disabled={!selectedState && low === minYear && high === maxYear}
        onClick={() => { onStateChange(undefined); onYearRangeChange([minYear, maxYear]); }}
      >×</button>
    </div>
  );
}

function LocationSelect({ value, states, unionTerritories, onChange }: { value?: string; states: string[]; unionTerritories: string[]; onChange: (value: string | undefined) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const displayValue = value ?? 'All India';
  const normalize = (s: string) => s.toLowerCase().includes(query.trim().toLowerCase());
  const filteredStates = useMemo(() => states.filter(normalize), [states, query]);
  const filteredUts = useMemo(() => unionTerritories.filter(normalize), [unionTerritories, query]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    inputRef.current?.focus();
    return () => { document.removeEventListener('mousedown', onPointer); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const choose = (name: string | undefined) => { onChange(name); setOpen(false); setQuery(''); };

  return (
    <div className={`state-select ${open ? 'is-open' : ''}`} ref={rootRef}>
      <button type="button" className="state-select__trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => { setOpen((v) => !v); setQuery(''); }}>
        <span>{displayValue}</span><span className="state-select__chevron" aria-hidden="true" />
      </button>
      {open && (
        <div className="state-select__menu" role="listbox" aria-label="Choose a state or union territory">
          <div className="state-select__search-wrap">
            <input ref={inputRef} className="state-select__search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search states or union territories" aria-label="Search states or union territories" autoComplete="off" />
          </div>
          <div className="state-select__options">
            <button type="button" className={`state-select__option ${!value ? 'is-active' : ''}`} role="option" aria-selected={!value} onClick={() => choose(undefined)}><span>All India</span>{!value && <span className="state-select__check">✓</span>}</button>
            {filteredStates.length > 0 && <div className="state-select__group-label">States</div>}
            {filteredStates.map((name) => <Option key={name} name={name} active={value === name} onChoose={choose} />)}
            {filteredUts.length > 0 && <div className="state-select__group-label">Union territories</div>}
            {filteredUts.map((name) => <Option key={name} name={name} active={value === name} onChoose={choose} />)}
            {!filteredStates.length && !filteredUts.length && <div className="state-select__empty">No location found.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function Option({ name, active, onChoose }: { name: string; active: boolean; onChoose: (name: string) => void }) {
  return <button type="button" className={`state-select__option ${active ? 'is-active' : ''}`} role="option" aria-selected={active} onClick={() => onChoose(name)}><span>{name}</span>{active && <span className="state-select__check">✓</span>}</button>;
}
