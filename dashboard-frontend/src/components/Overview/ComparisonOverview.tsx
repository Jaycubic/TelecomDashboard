// src/components/Overview/ComparisonOverview.tsx
// Replaces the four separate KPI cards. One comparison table instead of
// four independent numbers means the person never has to hold both
// operators' figures in their head at once to compare them -- and it
// gets rid of the n=9,385 problem: sample size moves into one plain-
// language sentence below the table instead of a badge on every metric.
import type { KpiResponse, KpiRow } from '../../types';
import { OPERATOR_COLOR } from '../../lib/constants';
import { compareMetric } from '../../lib/compare';
import { formatMillions, toNumber } from '../../lib/format';
import type { CarrierVisibility } from '../../hooks/useDashboardState';
import './ComparisonOverview.css';

interface ComparisonOverviewProps {
  kpis: KpiResponse | null;
  carrierVisibility: CarrierVisibility;
}

interface RowDef {
  key: 'avg_rating' | 'poor_voice_pct' | 'call_drop_pct';
  label: string;
  direction: 'higherIsBetter' | 'lowerIsBetter';
  closeThreshold: number;
  render: (v: number | null) => string;
}

const ROWS: RowDef[] = [
  {
    key: 'avg_rating',
    label: 'Overall rating',
    direction: 'higherIsBetter',
    closeThreshold: 0.05,
    render: (v) => (v === null ? '—' : `${v.toFixed(2)} / 5`),
  },
  {
    key: 'poor_voice_pct',
    label: 'Poor voice quality',
    direction: 'lowerIsBetter',
    closeThreshold: 1,
    render: (v) => (v === null ? '—' : `${v.toFixed(1)}%`),
  },
  {
    key: 'call_drop_pct',
    label: 'Calls dropped',
    direction: 'lowerIsBetter',
    closeThreshold: 1,
    render: (v) => (v === null ? '—' : `${v.toFixed(1)}%`),
  },
];

export function ComparisonOverview({ kpis, carrierVisibility }: ComparisonOverviewProps) {
  const rows = kpis?.kpis ?? [];
  const airtel = rows.find((r) => r.operator === 'Airtel');
  const jio = rows.find((r) => r.operator === 'Jio');
  const bothVisible = carrierVisibility.Airtel && carrierVisibility.Jio;

  if (!airtel && !jio) {
    return (
      <div className="comparison-overview comparison-overview--empty">
        No reports match the current filters. Try widening the location or time range.
      </div>
    );
  }

  const valueFor = (row: KpiRow | undefined, key: RowDef['key']) => (row ? toNumber(row[key]) : null);

  return (
    <section className="comparison-overview" aria-label="Call quality comparison">
      <table className="comparison-overview__table">
        <thead>
          <tr>
            <th scope="col" className="comparison-overview__row-label">
              Call quality overview
            </th>
            {carrierVisibility.Airtel && (
              <th scope="col">
                <i className="comparison-overview__dot" style={{ background: OPERATOR_COLOR.Airtel }} />
                Airtel
              </th>
            )}
            {carrierVisibility.Jio && (
              <th scope="col">
                <i className="comparison-overview__dot" style={{ background: OPERATOR_COLOR.Jio }} />
                Jio
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => {
            const airtelVal = valueFor(airtel, row.key);
            const jioVal = valueFor(jio, row.key);
            const cmp = bothVisible ? compareMetric(airtelVal, jioVal, row.direction, row.closeThreshold) : null;
            return (
              <tr key={row.key}>
                <th scope="row" className="comparison-overview__row-label">
                  {row.label}
                </th>
                {carrierVisibility.Airtel && (
                  <td className={cmp?.winner === 'Airtel' ? 'comparison-overview__cell--ahead' : ''}>
                    {row.render(airtelVal)}
                    {cmp?.winner === 'Airtel' && (
                      <span className="comparison-overview__badge comparison-overview__badge--good">Ahead</span>
                    )}
                  </td>
                )}
                {carrierVisibility.Jio && (
                  <td className={cmp?.winner === 'Jio' ? 'comparison-overview__cell--ahead' : ''}>
                    {row.render(jioVal)}
                    {cmp?.winner === 'Jio' && (
                      <span className="comparison-overview__badge comparison-overview__badge--good">Ahead</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
          {bothVisible && (
            <tr className="comparison-overview__meta-row">
              <th scope="row" className="comparison-overview__row-label">
                Close calls
              </th>
              <td colSpan={2} className="comparison-overview__meta-cell">
                {ROWS.filter((row) => {
                  const cmp = compareMetric(
                    valueFor(airtel, row.key),
                    valueFor(jio, row.key),
                    row.direction,
                    row.closeThreshold,
                  );
                  return cmp.winner === 'tie';
                }).length === 0
                  ? 'None — one operator is ahead on every metric shown here.'
                  : `About the same on: ${ROWS.filter((row) => {
                      const cmp = compareMetric(
                        valueFor(airtel, row.key),
                        valueFor(jio, row.key),
                        row.direction,
                        row.closeThreshold,
                      );
                      return cmp.winner === 'tie';
                    })
                      .map((r) => r.label.toLowerCase())
                      .join(', ')}`}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="comparison-overview__volume">
        Feedback received —{' '}
        {carrierVisibility.Airtel && airtel && (
          <>
            Airtel <strong className="tabular">{formatMillions(airtel.total_reports)}</strong> reports
          </>
        )}
        {carrierVisibility.Airtel && carrierVisibility.Jio && airtel && jio && ' · '}
        {carrierVisibility.Jio && jio && (
          <>
            Jio <strong className="tabular">{formatMillions(jio.total_reports)}</strong> reports
          </>
        )}
        {bothVisible && airtel && jio && (
          <span
            className="comparison-overview__hint"
            tabIndex={0}
            title="Jio has many more reports than Airtel in this data, so comparisons may not be equally representative."
          >
            {' '}
            ⓘ
          </span>
        )}
      </p>
    </section>
  );
}
