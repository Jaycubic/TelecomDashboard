// src/components/MetricPanel/MetricPanel.tsx
// Stacked metric cards for the right column: one card per KPI, 
// plus a mini indoor/outdoor card.
import type { KpiResponse, IndoorOutdoorResponse } from '../../types';
import type { CarrierVisibility } from '../../hooks/useDashboardState';
import { toNumber } from '../../lib/format';
import { compareMetric } from '../../lib/compare';
import './MetricPanel.css';

interface MetricPanelProps {
  kpis: KpiResponse | null;
  indoorOutdoor: IndoorOutdoorResponse | null;
  carrierVisibility: CarrierVisibility;
}

interface MetricDef {
  key: 'avg_rating' | 'call_drop_pct' | 'poor_voice_pct';
  label: string;
  description: string;
  direction: 'higherIsBetter' | 'lowerIsBetter';
  threshold: number;
  format: (v: number | null) => string;
}

const METRICS: MetricDef[] = [
  {
    key: 'avg_rating',
    label: 'Average rating',
    description: 'Customer-reported overall call quality score',
    direction: 'higherIsBetter',
    threshold: 0.05,
    format: (v) => v === null ? '—' : `${v.toFixed(2)} / 5`,
  },
  {
    key: 'call_drop_pct',
    label: 'Call drop rate',
    description: 'Percentage of calls reported as dropped',
    direction: 'lowerIsBetter',
    threshold: 1,
    format: (v) => v === null ? '—' : `${v.toFixed(1)}%`,
  },
  {
    key: 'poor_voice_pct',
    label: 'Poor voice quality',
    description: 'Percentage of calls rated as having poor voice',
    direction: 'lowerIsBetter',
    threshold: 1,
    format: (v) => v === null ? '—' : `${v.toFixed(1)}%`,
  },
];

export function MetricPanel({ kpis, indoorOutdoor, carrierVisibility }: MetricPanelProps) {
  const rows = kpis?.kpis ?? [];
  const airtel = rows.find((r) => r.operator === 'Airtel');
  const jio    = rows.find((r) => r.operator === 'Jio');
  const bothVisible = carrierVisibility.Airtel && carrierVisibility.Jio;

  if (!airtel && !jio) {
    return (
      <div className="metric-panel metric-panel--empty">
        <p>No data for current filters.</p>
      </div>
    );
  }

  return (
    <div className="metric-panel">
      <p className="metric-panel__heading">Metric breakdown</p>

      {METRICS.map((m) => {
        const airtelVal = airtel ? toNumber(airtel[m.key]) : null;
        const jioVal    = jio    ? toNumber(jio[m.key])    : null;
        const cmp = bothVisible
          ? compareMetric(airtelVal, jioVal, m.direction, m.threshold)
          : null;

        const winnerName =
          cmp?.winner === 'Airtel' ? 'Airtel' :
          cmp?.winner === 'Jio'    ? 'Jio'    : null;

        // For progress bars: normalize to 0–1
        // Rating: 0–5 → 0–1; percentages: 0–100 → 0–1
        const scale = m.key === 'avg_rating' ? 5 : 100;
        const airtelNorm = airtelVal !== null ? airtelVal / scale : null;
        const jioNorm    = jioVal    !== null ? jioVal    / scale : null;

        return (
          <div key={m.key} className="metric-card">
            <div className="metric-card__header">
              <div>
                <p className="metric-card__label">{m.label}</p>
                <p className="metric-card__desc">{m.description}</p>
              </div>
              {winnerName && (
                <span className={`metric-card__badge metric-card__badge--${winnerName.toLowerCase()}`}>
                  {winnerName} ahead
                </span>
              )}
              {cmp?.winner === 'tie' && (
                <span className="metric-card__badge metric-card__badge--tie">Similar</span>
              )}
            </div>

            <div className="metric-card__vals">
              {carrierVisibility.Airtel && airtelVal !== null && (
                <BarVal
                  operator="Airtel"
                  value={m.format(airtelVal)}
                  norm={airtelNorm ?? 0}
                  isWinner={cmp?.winner === 'Airtel'}
                  lowerBetter={m.direction === 'lowerIsBetter'}
                />
              )}
              {carrierVisibility.Jio && jioVal !== null && (
                <BarVal
                  operator="Jio"
                  value={m.format(jioVal)}
                  norm={jioNorm ?? 0}
                  isWinner={cmp?.winner === 'Jio'}
                  lowerBetter={m.direction === 'lowerIsBetter'}
                />
              )}
            </div>
          </div>
        );
      })}

      {/* Mini indoor/outdoor summary */}
      {indoorOutdoor && <IndoorMini data={indoorOutdoor} carrierVisibility={carrierVisibility} />}
    </div>
  );
}

function BarVal({
  operator,
  value,
  norm,
  isWinner,
  lowerBetter,
}: {
  operator: 'Airtel' | 'Jio';
  value: string;
  norm: number;
  isWinner: boolean;
  lowerBetter: boolean;
}) {
  // For lowerBetter metrics, invert the bar fill
  const barFill = lowerBetter ? 1 - norm : norm;

  return (
    <div className={`metric-bar ${isWinner ? 'metric-bar--winner' : ''}`}>
      <div className="metric-bar__top">
        <span className="metric-bar__operator">
          <span className={`metric-bar__dot metric-bar__dot--${operator.toLowerCase()}`} />
          {operator}
        </span>
        <span className="metric-bar__value tabular">{value}</span>
      </div>
      <div className="metric-bar__track">
        <div
          className={`metric-bar__fill metric-bar__fill--${operator.toLowerCase()}`}
          style={{ width: `${Math.max(2, barFill * 100)}%` }}
        />
      </div>
    </div>
  );
}

function IndoorMini({ data, carrierVisibility }: { data: IndoorOutdoorResponse; carrierVisibility: CarrierVisibility }) {
  const rows = data.breakdown;

  // Indoor satisfactory rates
  const airtelIndoor = rows.find((r) => r.operator === 'Airtel' && r.inout === 'Indoor');
  const jioIndoor    = rows.find((r) => r.operator === 'Jio'    && r.inout === 'Indoor');
  const airtelOut    = rows.find((r) => r.operator === 'Airtel' && r.inout === 'Outdoor');
  const jioOut       = rows.find((r) => r.operator === 'Jio'    && r.inout === 'Outdoor');

  if (!airtelIndoor && !jioIndoor) return null;

  return (
    <div className="indoor-mini">
      <p className="indoor-mini__heading">Satisfactory rate by setting</p>
      <div className="indoor-mini__grid">
        {['Indoor', 'Outdoor'].map((setting) => {
          const a = setting === 'Indoor' ? airtelIndoor : airtelOut;
          const j = setting === 'Indoor' ? jioIndoor    : jioOut;
          const aVal = toNumber(a?.satisfactory_pct);
          const jVal = toNumber(j?.satisfactory_pct);
          const cmp  = aVal !== null && jVal !== null
            ? compareMetric(aVal, jVal, 'higherIsBetter', 1)
            : null;

          return (
            <div key={setting} className="indoor-mini__cell">
              <p className="indoor-mini__cell-label">{setting}</p>
              {carrierVisibility.Airtel && aVal !== null && (
                <p className={`indoor-mini__cell-val tabular ${cmp?.winner === 'Airtel' ? 'indoor-mini__cell-val--winner-airtel' : ''}`}>
                  <span className="metric-bar__dot metric-bar__dot--airtel" />
                  {aVal.toFixed(1)}%
                </p>
              )}
              {carrierVisibility.Jio && jVal !== null && (
                <p className={`indoor-mini__cell-val tabular ${cmp?.winner === 'Jio' ? 'indoor-mini__cell-val--winner-jio' : ''}`}>
                  <span className="metric-bar__dot metric-bar__dot--jio" />
                  {jVal.toFixed(1)}%
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
