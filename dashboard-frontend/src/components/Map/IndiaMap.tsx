import { useEffect, useMemo, useRef, useState } from 'react';
import { INDIA_STATE_FEATURES, buildProjection, decodeStateFeatures, type StateFeature } from '../../lib/geo';
import { formatNumber, formatPct, toNumber } from '../../lib/format';
import { normalizeAreaName } from '../../lib/stateNameMap';
import type { ConfidenceRow, SpatialCell, StateQualityRow, MapTopologyResponse } from '../../types';
import type { CarrierVisibility } from '../../hooks/useDashboardState';
import type { ThemeMode } from '../../hooks/useTheme';
import { metricLeader } from '../../lib/analysis';
import './IndiaMap.css';

interface IndiaMapProps {
  stateRows: StateQualityRow[];
  confidenceRows: ConfidenceRow[];
  spatialCells: SpatialCell[];
  carrierVisibility: CarrierVisibility;
  selectedState: string | undefined;
  onSelectState: (state: string | undefined) => void;
  topology: MapTopologyResponse | null;
  theme: ThemeMode;
}

interface TooltipState {
  x: number;
  y: number;
  stateName?: string;
  cellKey?: string;
}

interface SpatialCellWithKey extends SpatialCell {
  key: string;
}

export function IndiaMap({
  stateRows,
  confidenceRows,
  spatialCells,
  carrierVisibility,
  selectedState,
  onSelectState,
  topology,
  theme,
}: IndiaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 820, height: 410 });
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  const features = useMemo<StateFeature[]>(() => {
    // The Vardhan state/UT GeoJSON is the preferred source. The API topology
    // remains as a fallback for deployments where the package is unavailable.
    const decoded = topology ? decodeStateFeatures(topology.state_features ?? topology.topology) : [];
    return INDIA_STATE_FEATURES.length >= 30 ? INDIA_STATE_FEATURES : (decoded.length >= 30 ? decoded : INDIA_STATE_FEATURES);
  }, [topology]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const width = entry.contentRect.width;
      setSize({ width, height: Math.max(270, Math.min(410, width * 0.44)) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasAnimated && stateRows.length) setHasAnimated(true);
  }, [stateRows.length, hasAnimated]);

  const selectedGeo = selectedState ? normalizeAreaName(selectedState) : undefined;
  const bothVisible = carrierVisibility.Airtel && carrierVisibility.Jio;
  const selectedOperator = carrierVisibility.Airtel ? 'Airtel' : 'Jio';
  const focusedFeature = selectedGeo ? features.find((feature) => normalizeAreaName(feature.properties.ST_NM) === selectedGeo) : undefined;
  const displayFeatures = focusedFeature ? [focusedFeature] : features;
  const focused = Boolean(selectedGeo && focusedFeature);

  const { path, projection } = useMemo(
    () => buildProjection(size.width, size.height, displayFeatures),
    [size.width, size.height, displayFeatures],
  );

  const rowsByGeo = useMemo(() => {
    const buckets = new Map<string, Map<string, StateQualityRow[]>>();
    for (const row of stateRows) {
      const area = normalizeAreaName(row.state_name);
      const operatorRows = buckets.get(area) ?? new Map<string, StateQualityRow[]>();
      const current = operatorRows.get(row.operator) ?? [];
      current.push(row);
      operatorRows.set(row.operator, current);
      buckets.set(area, operatorRows);
    }

    const merged = new Map<string, StateQualityRow[]>();
    for (const [area, operatorRows] of buckets) {
      const output: StateQualityRow[] = [];
      for (const operator of ['Airtel', 'Jio'] as const) {
        const rows = operatorRows.get(operator) ?? [];
        if (!rows.length) continue;
        const total = rows.reduce((sum, row) => sum + (toNumber(row.total_reports) ?? 0), 0);
        const weighted = (field: 'avg_rating' | 'call_drop_pct' | 'poor_voice_pct' | 'satisfactory_pct') => {
          if (!total) return null;
          let numerator = 0;
          let denominator = 0;
          for (const row of rows) {
            const weight = toNumber(row.total_reports) ?? 0;
            const value = toNumber(row[field]);
            if (value == null) continue;
            numerator += value * weight;
            denominator += weight;
          }
          return denominator ? numerator / denominator : null;
        };
        output.push({
          state_name: area,
          region: rows.find((row) => row.region)?.region ?? null,
          operator,
          total_reports: total,
          avg_rating: weighted('avg_rating'),
          call_drop_pct: weighted('call_drop_pct'),
          poor_voice_pct: weighted('poor_voice_pct'),
          satisfactory_pct: weighted('satisfactory_pct'),
        });
      }
      merged.set(area, output);
    }
    return merged;
  }, [stateRows]);

  const lowConfidence = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of confidenceRows) {
      if (!(bothVisible || row.operator === selectedOperator)) continue;
      const key = normalizeAreaName(row.state_name);
      counts.set(key, (counts.get(key) ?? 0) + (toNumber(row.total_reports) ?? 0));
    }
    return new Set([...counts.entries()].filter(([, count]) => count < 30).map(([name]) => name));
  }, [confidenceRows, bothVisible, selectedOperator]);

  const hasSelectionData = !selectedState || stateRows.length > 0;
  const cellRows = useMemo<SpatialCellWithKey[]>(() => spatialCells.map((cell, index) => ({
    ...cell,
    key: `${cell.operator}-${cell.lat}-${cell.lon}-${index}`,
  })), [spatialCells]);
  const maxCellReviews = useMemo(() => Math.max(1, ...cellRows.map((cell) => Number(cell.total_reviews) || 0)), [cellRows]);

  const title = focused
    ? bothVisible
      ? `How do Airtel and Jio compare within ${selectedGeo}?`
      : `Where are ${selectedOperator}’s reported ratings higher in ${selectedGeo}?`
    : bothVisible
      ? 'Where do Airtel and Jio ratings differ across India?'
      : `Where are ${selectedOperator}’s reported ratings higher or lower across India?`;

  const ariaLabel = focused
    ? bothVisible
      ? `State view for ${selectedGeo}, comparing Airtel and Jio review locations and state boundaries.`
      : `State view for ${selectedGeo}, showing ${selectedOperator} review locations and state boundary.`
    : bothVisible
      ? 'Map of India comparing Airtel and Jio customer-reported average rating by state and union territory.'
      : `Map of India showing ${selectedOperator} customer-reported average rating by state and union territory.`;

  return (
    <section className={`map-card ${focused ? 'map-card--focused' : ''}`} aria-label={focused ? `${selectedGeo} geographic map` : 'India geographic map'}>
      <div className="map-card__header">
        <div className="map-card__title-wrap">
          <h2>{title}</h2>
          {focused ? (
            <p className="map-card__description">
              {bothVisible
                ? 'Each circle aggregates nearby customer reviews. Circle size represents review volume; red and blue distinguish Airtel and Jio.'
                : `${selectedOperator} is shown as a state outline with aggregated review locations. Circle size represents review volume.`}
              {' '}No district boundaries are shown.
            </p>
          ) : (
            <p className="map-card__description">Each state or union territory shows which operator has the higher customer-reported average rating. Select a location to open its state view.</p>
          )}
          {!hasSelectionData && <p className="map-card__no-data">No customer reviews are available for {selectedState} in the dataset.</p>}
        </div>
        <div className="map-card__legend" aria-label="Map legend">
          {focused ? (
            <>
              {bothVisible ? (
                <>
                  <span><i className="legend-dot legend-dot--airtel" /> Airtel reviews</span>
                  <span><i className="legend-dot legend-dot--jio" /> Jio reviews</span>
                </>
              ) : (
                <span><i className={`legend-dot legend-dot--${selectedOperator.toLowerCase()}`} /> {selectedOperator} reviews</span>
              )}
              <span className="legend-size-note"><i className="legend-size-demo" /> Larger circles = more reviews</span>
            </>
          ) : (
            bothVisible ? (
              <>
                <span><i className="legend-dot legend-dot--airtel" /> Airtel higher rating</span>
                <span><i className="legend-dot legend-dot--jio" /> Jio higher rating</span>
                <span><i className="legend-dot legend-dot--similar" /> Same ratings</span>
              </>
            ) : (
              <span className="map-card__rating-scale">
                <span>Lower</span><i className={`rating-gradient rating-gradient--${selectedOperator.toLowerCase()}`} aria-hidden="true" /><span>Higher</span>
                <span className="sr-only">Lighter to darker {selectedOperator} hue indicates lower to higher reported average rating.</span>
              </span>
            )
          )}
          <span><i className="legend-hatch" /> Limited customer reviews</span>
        </div>
      </div>
      <div className="map-card__body">
        <div className="map-card__canvas" ref={containerRef}>
          <svg width={size.width} height={size.height} className={`map-svg ${focused ? 'map-svg--focused' : ''}`} role="img" aria-label={ariaLabel}>
            <defs>
              <pattern id="map-hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="6" stroke={theme === 'dark' ? '#FFFFFF' : '#111827'} strokeOpacity=".24" strokeWidth="1.2" />
              </pattern>
            </defs>

            {displayFeatures.map((feature) => {
              const name = normalizeAreaName(feature.properties.ST_NM);
              const rows = rowsByGeo.get(name) ?? [];
              const a = rows.find((row) => row.operator === 'Airtel');
              const j = rows.find((row) => row.operator === 'Jio');
              const av = a?.avg_rating == null ? null : toNumber(a.avg_rating);
              const jv = j?.avg_rating == null ? null : toNumber(j.avg_rating);
              const visibleA = carrierVisibility.Airtel ? av : null;
              const visibleJ = carrierVisibility.Jio ? jv : null;
              const leader = bothVisible ? metricLeader(visibleA, visibleJ, 'higherIsBetter', .05) : null;
              const selectedValue = selectedOperator === 'Airtel' ? visibleA : visibleJ;
              const hasData = bothVisible ? visibleA !== null || visibleJ !== null : selectedValue !== null;
              const isDimmed = Boolean(selectedGeo && !focused);
              const ratingIntensity = selectedValue == null ? 0 : Math.min(1, Math.max(0, selectedValue / 5));
              const fill = focused
                ? 'var(--color-surface-2)'
                : bothVisible
                  ? leader === 'Airtel' ? 'var(--color-airtel)' : leader === 'Jio' ? 'var(--color-jio)' : leader === 'similar' ? 'var(--color-neutral)' : 'var(--color-surface-3)'
                  : selectedOperator === 'Airtel' ? 'var(--color-airtel)' : 'var(--color-jio)';
              const opacity = focused ? .18 : !hasData ? .28 : isDimmed ? .14 : bothVisible ? (leader === 'similar' ? .68 : .84) : .16 + ratingIntensity * .70;
              const d = path(feature as unknown as GeoJSON.Geometry) ?? '';
              return (
                <g key={name}>
                  <path
                    d={d}
                    fill={fill}
                    fillOpacity={opacity}
                    stroke={focused ? 'var(--color-ink)' : isDimmed ? 'var(--color-map-stroke)' : 'var(--color-map-stroke)'}
                    strokeWidth={focused ? 2 : .8}
                    className={`map-state ${hasAnimated ? 'map-state--animated' : ''}`}
                    tabIndex={focused ? -1 : 0}
                    role={focused ? undefined : 'button'}
                    aria-label={focused ? undefined : `${name}. ${bothVisible ? leader === 'Airtel' ? 'Airtel has the higher average rating.' : leader === 'Jio' ? 'Jio has the higher average rating.' : leader === 'similar' ? 'Ratings are the same within the comparison threshold.' : 'No comparable data.' : selectedValue == null ? 'No rating data.' : `${selectedOperator} average rating is ${selectedValue.toFixed(2)} out of 5.`}`}
                    onClick={() => !focused && onSelectState(name)}
                    onKeyDown={(event) => { if (!focused && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onSelectState(name); } }}
                    onMouseMove={(event) => { if (focused) return; const rect = containerRef.current?.getBoundingClientRect(); if (rect) setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top, stateName: name }); }}
                    onMouseLeave={() => !focused && setTooltip(null)}
                  />
                  {!focused && lowConfidence.has(name) && hasData && <path d={d} fill="url(#map-hatch)" pointerEvents="none" opacity={isDimmed ? .2 : .9} />}
                </g>
              );
            })}

            {focused && (
              <>
                <g aria-hidden="true">
                  {cellRows.map((cell) => {
                    const lat = Number(cell.lat);
                    const lon = Number(cell.lon);
                    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
                    const [x, y] = projection([lon, lat]) ?? [NaN, NaN];
                    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
                    const count = Number(cell.total_reviews) || 0;
                    const radius = 3.3 + Math.sqrt(count / maxCellReviews) * 10.5;
                    const jitter = bothVisible ? 3.8 : 0;
                    const offset = cell.operator === 'Airtel' ? -jitter : jitter;
                    const cx = x + offset;
                    const cy = y;
                    const fill = cell.operator === 'Airtel' ? 'var(--color-airtel)' : 'var(--color-jio)';
                    const opacity = Math.min(.94, .46 + Math.sqrt(count / maxCellReviews) * .5);
                    return (
                      <circle
                        key={cell.key}
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill={fill}
                        fillOpacity={opacity}
                        stroke="var(--color-surface-1)"
                        strokeWidth={1.2}
                        className="map-cell"
                        tabIndex={0}
                        role="button"
                        aria-label={`${cell.operator} review cluster with ${count.toLocaleString('en-IN')} reviews and average rating ${toNumber(cell.avg_rating)?.toFixed(2) ?? 'not available'} out of 5.`}
                        onMouseMove={(event) => { const rect = containerRef.current?.getBoundingClientRect(); if (rect) setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top, cellKey: cell.key }); }}
                        onMouseLeave={() => setTooltip(null)}
                        onFocus={(event) => { const rect = containerRef.current?.getBoundingClientRect(); if (rect) setTooltip({ x: event.currentTarget.getBoundingClientRect().left - rect.left, y: event.currentTarget.getBoundingClientRect().top - rect.top, cellKey: cell.key }); }}
                        onBlur={() => setTooltip(null)}
                      />
                    );
                  })}
                </g>
                <text x={size.width / 2} y={size.height - 10} textAnchor="middle" className="map-state-label">{selectedGeo}</text>
              </>
            )}
          </svg>

          {!focused && tooltip?.stateName && (
            <MapTooltip
              {...tooltip}
              rows={rowsByGeo.get(tooltip.stateName) ?? []}
              lowConfidence={lowConfidence.has(tooltip.stateName)}
              carrierVisibility={carrierVisibility}
            />
          )}

          {focused && tooltip?.cellKey && (
            <CellTooltip
              {...tooltip}
              cell={cellRows.find((item) => item.key === tooltip.cellKey)}
              carrierVisibility={carrierVisibility}
            />
          )}

          {focused && !cellRows.length && (
            <div className="map-empty-state">
              <strong>No mapped customer reviews</strong>
              <span>There are no latitude/longitude observations for this selection.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MapTooltip({ x, y, stateName, rows, lowConfidence, carrierVisibility }: TooltipState & { rows: StateQualityRow[]; lowConfidence: boolean; carrierVisibility: CarrierVisibility }) {
  const airtel = rows.find((row) => row.operator === 'Airtel');
  const jio = rows.find((row) => row.operator === 'Jio');
  const av = airtel?.avg_rating == null ? null : toNumber(airtel.avg_rating);
  const jv = jio?.avg_rating == null ? null : toNumber(jio.avg_rating);
  const bothVisible = carrierVisibility.Airtel && carrierVisibility.Jio;
  const selectedOperator = carrierVisibility.Airtel ? 'Airtel' : 'Jio';
  const selectedRating = selectedOperator === 'Airtel' ? av : jv;
  const leader = bothVisible ? metricLeader(av, jv, 'higherIsBetter', .05) : null;
  return (
    <div className="map-tooltip" style={{ left: Math.min(x + 14, 520), top: Math.min(y + 14, 285) }} role="tooltip">
      <div className="map-tooltip__top"><strong>{stateName}</strong><span className={leader === 'Airtel' ? 'airtel' : leader === 'Jio' ? 'jio' : ''}>{bothVisible ? leader === 'Airtel' ? 'Airtel higher' : leader === 'Jio' ? 'Jio higher' : leader === 'similar' ? 'Same ratings' : 'No comparison' : selectedRating == null ? 'No rating' : `${selectedOperator} · ${selectedRating.toFixed(2)} / 5`}</span></div>
      <div className="map-tooltip__rows">
        {(bothVisible ? (['Airtel', 'Jio'] as const) : [selectedOperator as 'Airtel' | 'Jio']).map((operator) => {
          const row = operator === 'Airtel' ? airtel : jio;
          const rating = row?.avg_rating == null ? null : toNumber(row.avg_rating);
          return <div className="map-tooltip__row" key={operator}><span><i className={`legend-dot legend-dot--${operator.toLowerCase()}`} /> {operator}</span><b>{rating == null ? '—' : `${rating.toFixed(2)} / 5`}</b></div>;
        })}
      </div>
      <div className="map-tooltip__meta"><span>Call Drop Rate</span><span>{bothVisible ? `${formatPct(airtel?.call_drop_pct)} · ${formatPct(jio?.call_drop_pct)}` : formatPct(selectedOperator === 'Airtel' ? airtel?.call_drop_pct : jio?.call_drop_pct)}</span></div>
      <div className="map-tooltip__meta"><span>Total Customer Reviews</span><span>{bothVisible ? `${formatNumber(airtel?.total_reports)} · ${formatNumber(jio?.total_reports)}` : formatNumber(selectedOperator === 'Airtel' ? airtel?.total_reports : jio?.total_reports)}</span></div>
      {lowConfidence && <p className="map-tooltip__note">Limited customer reviews: fewer than 30 records.</p>}
    </div>
  );
}

function CellTooltip({ x, y, cell, carrierVisibility }: TooltipState & { cell?: SpatialCellWithKey; carrierVisibility: CarrierVisibility }) {
  if (!cell) return null;
  const count = Number(cell.total_reviews) || 0;
  const rating = toNumber(cell.avg_rating);
  return (
    <div className="map-tooltip map-tooltip--cell" style={{ left: Math.min(x + 14, 520), top: Math.min(y + 14, 285) }} role="tooltip">
      <div className="map-tooltip__top">
        <strong>{cell.operator} review cluster</strong>
        <span className={cell.operator === 'Airtel' ? 'airtel' : 'jio'}>{rating == null ? 'No rating' : `${rating.toFixed(2)} / 5`}</span>
      </div>
      <div className="map-tooltip__rows">
        <div className="map-tooltip__row"><span>Customer reviews</span><b>{count.toLocaleString('en-IN')}</b></div>
        <div className="map-tooltip__row"><span>Satisfactory rate</span><b>{toNumber(cell.satisfactory_pct)?.toFixed(1) ?? '—'}%</b></div>
      </div>
      <div className="map-tooltip__meta"><span>Location</span><span>Aggregated 0.1° cell</span></div>
      <p className="map-tooltip__hint">Dot size represents review volume; no district boundary is implied.</p>
    </div>
  );
}
