// src/components/Map/IndiaMap.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { INDIA_STATE_FEATURES, buildProjection } from '../../lib/geo';
import { buildStateFillMap, type StateFillResult } from '../../lib/mapColor';
import { toGeoJsonStateName } from '../../lib/stateNameMap';
import { formatPct } from '../../lib/format';
import { toNumber } from '../../lib/format';
import { CHART_THEME } from '../../lib/constants';
import type { ConfidenceRow, StateQualityRow } from '../../types';
import type { CarrierVisibility } from '../../hooks/useDashboardState';
import type { ThemeMode } from '../../hooks/useTheme';
import './IndiaMap.css';

interface IndiaMapProps {
  stateRows: StateQualityRow[];
  confidenceRows: ConfidenceRow[];
  carrierVisibility: CarrierVisibility;
  selectedState: string | undefined;
  onSelectState: (state: string | undefined) => void;
  theme: ThemeMode;
}

interface TooltipState {
  x: number;
  y: number;
  stName: string;
  rows: StateQualityRow[];
  fillInfo: StateFillResult | undefined;
}

export function IndiaMap({
  stateRows,
  confidenceRows,
  carrierVisibility,
  selectedState,
  onSelectState,
  theme,
}: IndiaMapProps) {
  const colors = CHART_THEME[theme];
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 720, height: 680 });
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width } = entry.contentRect;
      setSize({ width, height: Math.max(440, width * 0.88) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasAnimated && stateRows.length > 0) setHasAnimated(true);
  }, [stateRows, hasAnimated]);

  const { path } = useMemo(() => buildProjection(size.width, size.height), [size.width, size.height]);

  const fillMap = useMemo(
    () => buildStateFillMap(stateRows, confidenceRows, carrierVisibility, colors.noData),
    [stateRows, confidenceRows, carrierVisibility, colors.noData],
  );

  const rowsByGeoName = useMemo(() => {
    const map = new Map<string, StateQualityRow[]>();
    for (const row of stateRows) {
      const geoName = toGeoJsonStateName(row.state_name);
      const list = map.get(geoName) ?? [];
      list.push(row);
      map.set(geoName, list);
    }
    return map;
  }, [stateRows]);

  const selectedGeoName = selectedState ? toGeoJsonStateName(selectedState) : undefined;

  return (
    <div className="india-map">
      {/* Map header */}
      <div className="india-map__header">
        <div>
          <h2 className="india-map__title">Where does each operator lead?</h2>
          <p className="india-map__subtitle">
            Each state is shaded by which network customers report better call quality with.
            {selectedState && (
              <> Filtered to <strong>{selectedState}</strong> —{' '}
                <button className="india-map__clear" onClick={() => onSelectState(undefined)}>
                  show all states
                </button>
              </>
            )}
          </p>
        </div>

        {/* Legend */}
        <div className="india-map__legend">
          <span className="india-map__legend-item">
            <span className="india-map__legend-swatch india-map__legend-swatch--airtel" />
            Airtel ahead
          </span>
          <span className="india-map__legend-item">
            <span className="india-map__legend-swatch india-map__legend-swatch--jio" />
            Jio ahead
          </span>
          <span className="india-map__legend-item">
            <span className="india-map__legend-swatch india-map__legend-swatch--tie" />
            Similar
          </span>
          <span
            className="india-map__legend-item"
            title="Fewer than 30 reports — treat as directional, not conclusive"
          >
            <span className="india-map__legend-swatch india-map__legend-swatch--hatch" />
            Limited data
          </span>
        </div>
      </div>

      {/* SVG map */}
      <div className="india-map__svg-wrap" ref={containerRef}>
        <svg
          width={size.width}
          height={size.height}
          role="img"
          aria-label="Map of India showing which mobile network — Airtel or Jio — customers report better call quality with in each state."
          className="india-map__svg"
        >
          <defs>
            <pattern
              id="hatch-pattern"
              width="5"
              height="5"
              patternTransform="rotate(45)"
              patternUnits="userSpaceOnUse"
            >
              <line
                x1="0" y1="0" x2="0" y2="5"
                stroke={theme === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)'}
                strokeWidth="1.2"
              />
            </pattern>

            {/* Drop shadow filter for selected state */}
            <filter id="state-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor={theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} result="color" />
              <feComposite in="color" in2="blur" operator="in" result="shadow" />
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* State fills */}
          {INDIA_STATE_FEATURES.map((f) => {
            const name = f.properties.ST_NM;
            const info = fillMap.get(name);
            const d = path(f as unknown as GeoJSON.Geometry) ?? '';
            const isSelected = selectedGeoName === name;
            const isDimmed = selectedGeoName !== undefined && !isSelected;

            return (
              <path
                key={name}
                d={d}
                fill={info ? info.fill : colors.noData}
                fillOpacity={isDimmed ? 0.22 : info ? info.opacity : 1}
                stroke={isSelected
                  ? (theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)')
                  : theme === 'dark' ? 'rgba(13,17,23,0.8)' : 'rgba(255,255,255,0.9)'}
                strokeWidth={isSelected ? 2 : 0.75}
                className={`india-map__state ${hasAnimated ? 'india-map__state--drawn' : ''}`}
                tabIndex={0}
                role="button"
                aria-label={`${name}: ${
                  info?.hasData
                    ? info.leadingOperator === 'tie'
                      ? 'Airtel and Jio report similar quality'
                      : `${info.leadingOperator} leads`
                    : 'no reports for current filters'
                }. Click to filter to this state.`}
                onClick={() => onSelectState(selectedGeoName === name ? undefined : name)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectState(selectedGeoName === name ? undefined : name);
                  }
                }}
                onMouseMove={(e) => {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  setTooltip({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    stName: name,
                    rows: rowsByGeoName.get(name) ?? [],
                    fillInfo: info,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}

          {/* Low-confidence hatch overlay */}
          {INDIA_STATE_FEATURES.map((f) => {
            const name = f.properties.ST_NM;
            const info = fillMap.get(name);
            if (!info?.lowConfidence) return null;
            const d = path(f as unknown as GeoJSON.Geometry) ?? '';
            return (
              <path
                key={`${name}-hatch`}
                d={d}
                fill="url(#hatch-pattern)"
                pointerEvents="none"
                opacity={selectedGeoName && selectedGeoName !== name ? 0.22 : 1}
              />
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <MapTooltip tooltip={tooltip} />
        )}
      </div>
    </div>
  );
}

function MapTooltip({ tooltip }: { tooltip: TooltipState }) {
  const { x, y, stName, rows, fillInfo } = tooltip;

  const airtelRow = rows.find((r) => r.operator === 'Airtel');
  const jioRow    = rows.find((r) => r.operator === 'Jio');

  const leaderLabel =
    fillInfo?.leadingOperator === 'Airtel' ? 'Airtel ahead' :
    fillInfo?.leadingOperator === 'Jio'    ? 'Jio ahead' :
    fillInfo?.leadingOperator === 'tie'    ? 'Similar quality' : null;

  return (
    <div
      className="india-map__tooltip"
      style={{ left: x + 14, top: y + 14 }}
      role="tooltip"
    >
      <div className="india-map__tooltip-header">
        <span className="india-map__tooltip-name">{stName}</span>
        {leaderLabel && (
          <span className={`india-map__tooltip-verdict india-map__tooltip-verdict--${fillInfo?.leadingOperator}`}>
            {leaderLabel}
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="india-map__tooltip-empty">No reports for current filters</p>
      ) : (
        <table className="india-map__tooltip-table">
          <thead>
            <tr>
              <th></th>
              <th>Rating</th>
              <th>Call drops</th>
              <th>Poor voice</th>
            </tr>
          </thead>
          <tbody>
            {airtelRow && (
              <tr>
                <td><span className="india-map__tooltip-dot india-map__tooltip-dot--airtel" /> Airtel</td>
                <td className="tabular">{toNumber(airtelRow.avg_rating)?.toFixed(1) ?? '—'} / 5</td>
                <td className="tabular">{formatPct(airtelRow.call_drop_pct)}</td>
                <td className="tabular">{formatPct(airtelRow.poor_voice_pct)}</td>
              </tr>
            )}
            {jioRow && (
              <tr>
                <td><span className="india-map__tooltip-dot india-map__tooltip-dot--jio" /> Jio</td>
                <td className="tabular">{toNumber(jioRow.avg_rating)?.toFixed(1) ?? '—'} / 5</td>
                <td className="tabular">{formatPct(jioRow.call_drop_pct)}</td>
                <td className="tabular">{formatPct(jioRow.poor_voice_pct)}</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {fillInfo?.lowConfidence && (
        <p className="india-map__tooltip-caveat">
          ⚠ Limited feedback — treat as directional
        </p>
      )}
      <p className="india-map__tooltip-hint">Click to filter to this state</p>
    </div>
  );
}
