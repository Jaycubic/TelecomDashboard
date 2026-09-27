import { useEffect, useMemo, useRef, useState } from 'react';
import { INDIA_STATE_FEATURES, buildProjection } from '../../lib/geo';
import { formatNumber, formatPct } from '../../lib/format';
import { toGeoJsonStateName } from '../../lib/stateNameMap';
import type { ConfidenceRow, StateQualityRow } from '../../types';
import type { CarrierVisibility } from '../../hooks/useDashboardState';
import type { ThemeMode } from '../../hooks/useTheme';
import { metricLeader } from '../../lib/analysis';
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
  stateName: string;
}

export function IndiaMap({
  stateRows,
  confidenceRows,
  carrierVisibility,
  selectedState,
  onSelectState,
  theme,
}: IndiaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 720, height: 650 });
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const width = entry.contentRect.width;
      setSize({ width, height: Math.max(400, Math.min(560, width * .62)) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasAnimated && stateRows.length) setHasAnimated(true);
  }, [stateRows.length, hasAnimated]);

  const { path } = useMemo(() => buildProjection(size.width, size.height), [size.width, size.height]);

  const rowsByGeo = useMemo(() => {
    const map = new Map<string, StateQualityRow[]>();
    for (const row of stateRows) {
      const key = toGeoJsonStateName(row.state_name);
      map.set(key, [...(map.get(key) ?? []), row]);
    }
    return map;
  }, [stateRows]);

  const lowConfidence = useMemo(() => {
    return new Set(
      confidenceRows.filter((row) => row.confidence === 'low').map((row) => toGeoJsonStateName(row.state_name)),
    );
  }, [confidenceRows]);

  const selectedGeo = selectedState ? toGeoJsonStateName(selectedState) : undefined;

  return (
    <section className="map-card">
      <div className="map-card__header">
        <div>
          <div className="section-kicker">Geography</div>
          <h2>Where does the gap show up?</h2>
          <p>Each state is colored by the operator with the higher customer-reported average rating. Click a state to focus the dashboard.</p>
        </div>
        <div className="map-card__legend" aria-label="Map legend">
          <span><i className="legend-dot legend-dot--airtel" /> Airtel higher</span>
          <span><i className="legend-dot legend-dot--jio" /> Jio higher</span>
          <span><i className="legend-dot legend-dot--similar" /> Similar</span>
          <span><i className="legend-hatch" /> Limited reports</span>
        </div>
      </div>

      <div className="map-card__body">
        <div className="map-card__canvas" ref={containerRef}>
          <svg
            width={size.width}
            height={size.height}
            className="map-svg"
            role="img"
            aria-label="Map of India comparing Airtel and Jio customer-reported average call quality by state"
          >
            <defs>
              <pattern id="map-hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="6" stroke={theme === 'dark' ? '#FFFFFF' : '#111827'} strokeOpacity=".22" strokeWidth="1.2" />
              </pattern>
            </defs>
            {INDIA_STATE_FEATURES.map((feature) => {
              const name = feature.properties.ST_NM;
              const rows = rowsByGeo.get(name) ?? [];
              const a = rows.find((row) => row.operator === 'Airtel');
              const j = rows.find((row) => row.operator === 'Jio');
              const av = a?.avg_rating == null ? null : Number(a.avg_rating);
              const jv = j?.avg_rating == null ? null : Number(j.avg_rating);
              const visibleA = carrierVisibility.Airtel ? av : null;
              const visibleJ = carrierVisibility.Jio ? jv : null;
              const leader = metricLeader(visibleA, visibleJ, 'higherIsBetter', .05);
              const hasData = visibleA !== null || visibleJ !== null;
              const isSelected = selectedGeo === name;
              const isDimmed = !!selectedGeo && !isSelected;
              const fill = leader === 'Airtel' ? 'var(--color-airtel)' : leader === 'Jio' ? 'var(--color-jio)' : leader === 'similar' ? 'var(--color-neutral)' : 'var(--color-surface-3)';
              const opacity = hasData ? (isDimmed ? .16 : leader === 'similar' ? .7 : .85) : .55;
              const d = path(feature as unknown as GeoJSON.Geometry) ?? '';

              return (
                <g key={name}>
                  <path
                    d={d}
                    fill={fill}
                    fillOpacity={opacity}
                    stroke={isSelected ? 'var(--color-ink)' : 'var(--color-map-stroke)'}
                    strokeWidth={isSelected ? 2.4 : 0.8}
                    className={`map-state ${hasAnimated ? 'map-state--animated' : ''}`}
                    tabIndex={0}
                    role="button"
                    aria-label={`${name}. ${leader === 'Airtel' ? 'Airtel has the higher average rating.' : leader === 'Jio' ? 'Jio has the higher average rating.' : leader === 'similar' ? 'Average ratings are similar.' : 'No comparable data.'}`}
                    onClick={() => onSelectState(selectedGeo === name ? undefined : name)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelectState(selectedGeo === name ? undefined : name);
                      }
                    }}
                    onMouseMove={(event) => {
                      const rect = containerRef.current?.getBoundingClientRect();
                      if (!rect) return;
                      setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top, stateName: name });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                  {lowConfidence.has(name) && hasData && <path d={d} fill="url(#map-hatch)" pointerEvents="none" opacity={isDimmed ? .22 : .9} />}
                </g>
              );
            })}
          </svg>

          {tooltip && <MapTooltip {...tooltip} rows={rowsByGeo.get(tooltip.stateName) ?? []} lowConfidence={lowConfidence.has(tooltip.stateName)} />}
        </div>
      </div>
    </section>
  );
}

function MapTooltip({ x, y, stateName, rows, lowConfidence }: TooltipState & { rows: StateQualityRow[]; lowConfidence: boolean }) {
  const airtel = rows.find((row) => row.operator === 'Airtel');
  const jio = rows.find((row) => row.operator === 'Jio');
  const av = airtel?.avg_rating == null ? null : Number(airtel.avg_rating);
  const jv = jio?.avg_rating == null ? null : Number(jio.avg_rating);
  const leader = metricLeader(av, jv, 'higherIsBetter', .05);

  return (
    <div className="map-tooltip" style={{ left: Math.min(x + 14, Math.max(8, x - 220)), top: Math.min(y + 14, 455) }} role="tooltip">
      <div className="map-tooltip__top">
        <strong>{stateName}</strong>
        <span className={leader === 'Airtel' ? 'airtel' : leader === 'Jio' ? 'jio' : ''}>
          {leader === 'Airtel' ? 'Airtel higher' : leader === 'Jio' ? 'Jio higher' : leader === 'similar' ? 'Similar' : 'No comparison'}
        </span>
      </div>
      <div className="map-tooltip__rows">
        {(['Airtel', 'Jio'] as const).map((operator) => {
          const row = operator === 'Airtel' ? airtel : jio;
          const rating = row?.avg_rating == null ? null : Number(row.avg_rating);
          return (
            <div className="map-tooltip__row" key={operator}>
              <span><i className={`legend-dot legend-dot--${operator.toLowerCase()}`} /> {operator}</span>
              <b>{rating === null || !Number.isFinite(rating) ? '—' : `${rating.toFixed(2)} / 5`}</b>
            </div>
          );
        })}
      </div>
      <div className="map-tooltip__meta">
        <span>Call drops</span>
        <span>{formatPct(airtel?.call_drop_pct)} · {formatPct(jio?.call_drop_pct)}</span>
      </div>
      <div className="map-tooltip__meta">
        <span>Reports</span>
        <span>{formatNumber(airtel?.total_reports)} · {formatNumber(jio?.total_reports)}</span>
      </div>
      {lowConfidence && <p className="map-tooltip__note">Limited feedback: fewer than 30 reports.</p>}
      <p className="map-tooltip__hint">Click the state to filter the dashboard.</p>
    </div>
  );
}
