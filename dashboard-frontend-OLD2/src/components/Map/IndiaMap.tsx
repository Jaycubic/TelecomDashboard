// src/components/Map/IndiaMap.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { INDIA_STATE_FEATURES, buildProjection } from '../../lib/geo';
import { buildStateFillMap, type StateFillResult } from '../../lib/mapColor';
import { toGeoJsonStateName } from '../../lib/stateNameMap';
import { formatPct } from '../../lib/format';
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
  const [size, setSize] = useState({ width: 640, height: 640 });
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width } = entry.contentRect;
      setSize({ width, height: Math.max(420, width * 0.92) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // one orchestrated draw-in the first time the map has real data -- not
  // replayed on every filter change, that would read as scattered/fidgety
  useEffect(() => {
    if (!hasAnimated && stateRows.length > 0) {
      setHasAnimated(true);
    }
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
    <div className="india-map" ref={containerRef}>
      <svg
        width={size.width}
        height={size.height}
        role="img"
        aria-label="Map of India shaded by which network -- Airtel or Jio -- customers report better call quality with in each state. States with too few reports to be confident are marked with a diagonal hatch pattern."
      >
        <defs>
          <pattern
            id="low-confidence-hatch"
            width="6"
            height="6"
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="0" y2="6" stroke={colors.hatch} strokeWidth="1.5" />
          </pattern>
        </defs>

        {INDIA_STATE_FEATURES.map((f) => {
          const name = f.properties.ST_NM;
          const info = fillMap.get(name);
          const d = path(f as unknown as GeoJSON.Geometry) ?? '';
          const isSelected = selectedGeoName === name;

          return (
            <path
              key={name}
              d={d}
              fill={info ? info.fill : colors.noData}
              fillOpacity={info ? info.opacity : 1}
              stroke={isSelected ? 'var(--color-ink)' : colors.mapStroke}
              strokeWidth={isSelected ? 2 : 0.75}
              className={`india-map__state ${hasAnimated ? 'india-map__state--drawn' : ''}`}
              tabIndex={0}
              role="button"
              aria-label={`${name}: ${
                info?.hasData
                  ? info.leadingOperator === 'tie'
                    ? 'Airtel and Jio report similar quality'
                    : `${info.leadingOperator} reports better quality here`
                  : 'no reports for current filters'
              }`}
              onClick={() =>
                onSelectState(selectedGeoName === name ? undefined : name)
              }
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

        {/* low-confidence overlay, drawn after the fills so the hatch sits on top */}
        {INDIA_STATE_FEATURES.map((f) => {
          const name = f.properties.ST_NM;
          const info = fillMap.get(name);
          if (!info?.lowConfidence) return null;
          const d = path(f as unknown as GeoJSON.Geometry) ?? '';
          return (
            <path
              key={`${name}-hatch`}
              d={d}
              fill="url(#low-confidence-hatch)"
              pointerEvents="none"
            />
          );
        })}
      </svg>

      {tooltip && (
        <div
          className="india-map__tooltip"
          style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
          role="tooltip"
        >
          <p className="india-map__tooltip-title">{tooltip.stName}</p>
          {tooltip.rows.length === 0 && <p>No reports for current filters</p>}
          {tooltip.rows.map((r) => (
            <p key={r.operator} className="india-map__tooltip-row">
              <span className={`india-map__tooltip-dot india-map__tooltip-dot--${r.operator}`} />
              {r.operator}: {formatPct(r.call_drop_pct)} drop rate, avg {toNumberSafe(r.avg_rating)}/5
            </p>
          ))}
          {tooltip.fillInfo?.lowConfidence && (
            <p className="india-map__tooltip-caveat">
              Limited feedback here — treat as directional, not conclusive
            </p>
          )}
          <p className="india-map__tooltip-hint">Click to filter the dashboard to this state</p>
        </div>
      )}
    </div>
  );
}

function toNumberSafe(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n.toFixed(1) : '—';
}
