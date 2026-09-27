import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
  children?: ReactNode;
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
  children,
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
      setSize({ width, height: Math.max(330, Math.min(490, width * .53)) });
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

  const selectedGeo = selectedState ? toGeoJsonStateName(selectedState) : undefined;
  const bothVisible = carrierVisibility.Airtel && carrierVisibility.Jio;
  const selectedOperator = carrierVisibility.Airtel ? 'Airtel' : 'Jio';

  const lowConfidence = useMemo(() => {
    return new Set(
      confidenceRows
        .filter((row) => row.confidence === 'low' && (bothVisible || row.operator === selectedOperator))
        .map((row) => toGeoJsonStateName(row.state_name)),
    );
  }, [confidenceRows, bothVisible, selectedOperator]);

  return (
    <section className="map-card">
      {children}
      <div className="map-card__header">
        <div>
          <div className="section-kicker">Geography</div>
          <h2>{bothVisible ? 'Where do customer ratings differ?' : `Where is the reported rating higher or lower for ${selectedOperator}?`}</h2>
          <p>{bothVisible
            ? 'Each state shows which operator has the higher average customer rating. Select a state to focus the dashboard.'
            : `${selectedOperator} is shown as a rating range by state. Darker states represent higher reported average ratings. Select a state to focus the dashboard.`}
          </p>
        </div>
        <div className="map-card__legend" aria-label="Map legend">
          {bothVisible ? (
            <>
              <span><i className="legend-dot legend-dot--airtel" /> Airtel higher rating</span>
              <span><i className="legend-dot legend-dot--jio" /> Jio higher rating</span>
              <span><i className="legend-dot legend-dot--similar" /> Similar ratings</span>
            </>
          ) : (
            <>
              <span><i className={`rating-swatch rating-swatch--low rating-swatch--low-${selectedOperator.toLowerCase()}`} /> Lower rating</span>
              <span><i className={`rating-swatch rating-swatch--high rating-swatch--high-${selectedOperator.toLowerCase()}`} /> Higher rating</span>
            </>
          )}
          <span><i className="legend-hatch" /> Limited feedback</span>
        </div>
      </div>

      <div className="map-card__body">
        <div className="map-card__canvas" ref={containerRef}>
          <svg
            width={size.width}
            height={size.height}
            className="map-svg"
            role="img"
            aria-label={bothVisible ? "Map of India comparing Airtel and Jio customer-reported average call quality by state" : `Map of India showing ${selectedOperator} customer-reported average rating by state`}
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
              const leader = bothVisible ? metricLeader(visibleA, visibleJ, 'higherIsBetter', .05) : null;
              const selectedValue = selectedOperator === 'Airtel' ? visibleA : visibleJ;
              const hasData = bothVisible ? visibleA !== null || visibleJ !== null : selectedValue !== null;
              const isSelected = selectedGeo === name;
              const isDimmed = !!selectedGeo && !isSelected;
              const ratingIntensity = selectedValue == null ? 0 : Math.min(1, Math.max(0, selectedValue / 5));
              const fill = bothVisible
                ? leader === 'Airtel' ? 'var(--color-airtel)' : leader === 'Jio' ? 'var(--color-jio)' : leader === 'similar' ? 'var(--color-neutral)' : 'var(--color-surface-3)'
                : selectedOperator === 'Airtel' ? 'var(--color-airtel)' : 'var(--color-jio)';
              const opacity = !hasData
                ? .55
                : isDimmed
                  ? .14
                  : bothVisible
                    ? leader === 'similar' ? .72 : .86
                    : .18 + ratingIntensity * .68;
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
                    aria-label={`${name}. ${bothVisible
                      ? leader === 'Airtel' ? 'Airtel has the higher average rating.' : leader === 'Jio' ? 'Jio has the higher average rating.' : leader === 'similar' ? 'Average ratings are similar.' : 'No comparable data.'
                      : selectedValue == null ? 'No rating data.' : `${selectedOperator} average rating is ${selectedValue.toFixed(2)} out of 5.`}`}
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

          {tooltip && <MapTooltip
            {...tooltip}
            rows={rowsByGeo.get(tooltip.stateName) ?? []}
            lowConfidence={lowConfidence.has(tooltip.stateName)}
            carrierVisibility={carrierVisibility}
          />}
        </div>
      </div>
    </section>
  );
}

function MapTooltip({ x, y, stateName, rows, lowConfidence, carrierVisibility }: TooltipState & { rows: StateQualityRow[]; lowConfidence: boolean; carrierVisibility: CarrierVisibility }) {
  const airtel = rows.find((row) => row.operator === 'Airtel');
  const jio = rows.find((row) => row.operator === 'Jio');
  const av = airtel?.avg_rating == null ? null : Number(airtel.avg_rating);
  const jv = jio?.avg_rating == null ? null : Number(jio.avg_rating);
  const bothVisible = carrierVisibility.Airtel && carrierVisibility.Jio;
  const selectedOperator = carrierVisibility.Airtel ? 'Airtel' : 'Jio';
  const selectedRating = selectedOperator === 'Airtel' ? av : jv;
  const leader = bothVisible ? metricLeader(av, jv, 'higherIsBetter', .05) : null;

  return (
    <div className="map-tooltip" style={{ left: Math.min(x + 14, Math.max(8, x - 220)), top: Math.min(y + 14, 455) }} role="tooltip">
      <div className="map-tooltip__top">
        <strong>{stateName}</strong>
        <span className={leader === 'Airtel' ? 'airtel' : leader === 'Jio' ? 'jio' : ''}>
          {bothVisible
            ? leader === 'Airtel' ? 'Airtel higher' : leader === 'Jio' ? 'Jio higher' : leader === 'similar' ? 'Similar ratings' : 'No comparison'
            : selectedRating == null ? 'No rating' : `${selectedOperator} · ${selectedRating.toFixed(2)} / 5`}
        </span>
      </div>
      <div className="map-tooltip__rows">
        {bothVisible ? (
          (['Airtel', 'Jio'] as const).map((operator) => {
            const row = operator === 'Airtel' ? airtel : jio;
            const rating = row?.avg_rating == null ? null : Number(row.avg_rating);
            return (
              <div className="map-tooltip__row" key={operator}>
                <span><i className={`legend-dot legend-dot--${operator.toLowerCase()}`} /> {operator}</span>
                <b>{rating === null || !Number.isFinite(rating) ? '—' : `${rating.toFixed(2)} / 5`}</b>
              </div>
            );
          })
        ) : (
          <div className="map-tooltip__row">
            <span><i className={`legend-dot legend-dot--${selectedOperator.toLowerCase()}`} /> {selectedOperator} average rating</span>
            <b>{selectedRating == null ? '—' : `${selectedRating.toFixed(2)} / 5`}</b>
          </div>
        )}
      </div>
      <div className="map-tooltip__meta">
        <span>Dropped-call report share</span>
        <span>{bothVisible ? `${formatPct(airtel?.call_drop_pct)} · ${formatPct(jio?.call_drop_pct)}` : formatPct(selectedOperator === 'Airtel' ? airtel?.call_drop_pct : jio?.call_drop_pct)}</span>
      </div>
      <div className="map-tooltip__meta">
        <span>Customer reports</span>
        <span>{bothVisible ? `${formatNumber(airtel?.total_reports)} · ${formatNumber(jio?.total_reports)}` : formatNumber(selectedOperator === 'Airtel' ? airtel?.total_reports : jio?.total_reports)}</span>
      </div>
      {lowConfidence && <p className="map-tooltip__note">Limited feedback: fewer than 30 reports.</p>}
      <p className="map-tooltip__hint">Click the state to filter the dashboard.</p>
    </div>
  );
}
