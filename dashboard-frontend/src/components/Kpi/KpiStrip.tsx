// src/components/Kpi/KpiStrip.tsx
import type { KpiResponse } from '../../types';
import { OPERATOR_COLOR } from '../../lib/constants';
import { formatMillions, formatNumber, formatPct, toNumber } from '../../lib/format';
import type { CarrierVisibility } from '../../hooks/useDashboardState';
import './KpiStrip.css';

interface KpiStripProps {
  kpis: KpiResponse | null;
  carrierVisibility: CarrierVisibility;
}

interface MetricDef {
  key: string;
  label: string;
  render: (row: (typeof rowsPlaceholder)[number]) => string;
  /** true if a lower number is the better outcome (call drops, poor voice) */
  lowerIsBetter?: boolean;
  isRate?: boolean;
}

// only for typeof inference above; never used at runtime
const rowsPlaceholder: KpiResponse['kpis'] = [];

const METRICS: MetricDef[] = [
  {
    key: 'total_reports',
    label: 'Feedback reports',
    render: (row) => formatMillions(row.total_reports),
  },
  {
    key: 'call_drop_pct',
    label: 'Call drop rate',
    render: (row) => formatPct(row.call_drop_pct),
    lowerIsBetter: true,
    isRate: true,
  },
  {
    key: 'avg_rating',
    label: 'Avg. satisfaction (1–5)',
    render: (row) => (toNumber(row.avg_rating) ?? 0).toFixed(2),
  },
  {
    key: 'poor_voice_pct',
    label: 'Poor voice quality rate',
    render: (row) => formatPct(row.poor_voice_pct),
    lowerIsBetter: true,
    isRate: true,
  },
];

export function KpiStrip({ kpis, carrierVisibility }: KpiStripProps) {
  const rows = kpis?.kpis ?? [];
  const airtel = rows.find((r) => r.operator === 'Airtel');
  const jio = rows.find((r) => r.operator === 'Jio');

  if (!airtel && !jio) {
    return (
      <div className="kpi-strip kpi-strip--empty">
        No reports match the current filters. Try widening the region, state or year range.
      </div>
    );
  }

  return (
    <div className="kpi-strip" role="group" aria-label="Key performance indicators">
      {METRICS.map((metric) => (
        <div className="kpi-card" key={metric.key}>
          <p className="kpi-card__label">{metric.label}</p>
          <div className="kpi-card__rows">
            {carrierVisibility.Airtel && airtel && (
              <div className="kpi-card__row">
                <span className="kpi-card__dot" style={{ background: OPERATOR_COLOR.Airtel }} />
                <span className="kpi-card__operator">Airtel</span>
                <span className="kpi-card__value tabular">{metric.render(airtel)}</span>
                <span className="kpi-card__n tabular">n={formatNumber(airtel.total_reports)}</span>
              </div>
            )}
            {carrierVisibility.Jio && jio && (
              <div className="kpi-card__row">
                <span className="kpi-card__dot" style={{ background: OPERATOR_COLOR.Jio }} />
                <span className="kpi-card__operator">Jio</span>
                <span className="kpi-card__value tabular">{metric.render(jio)}</span>
                <span className="kpi-card__n tabular">n={formatNumber(jio.total_reports)}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
