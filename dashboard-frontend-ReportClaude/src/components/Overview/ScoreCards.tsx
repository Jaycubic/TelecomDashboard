// src/components/Overview/ScoreCards.tsx
// Replaces the four small KPI cards (and, in the last pass, the
// comparison table) with three big-number scorecards -- the "headline
// stat" treatment, because the headline stat genuinely is the most
// characteristic thing this dashboard has to show: two numbers, next to
// each other, on the metrics people actually came here to compare.
import type { KpiResponse, KpiRow } from '../../types';
import { OPERATOR_COLOR } from '../../lib/constants';
import { compareMetric } from '../../lib/compare';
import { formatMillions, toNumber } from '../../lib/format';
import type { CarrierVisibility } from '../../hooks/useDashboardState';
import './ScoreCards.css';

interface ScoreCardsProps {
  kpis: KpiResponse | null;
  carrierVisibility: CarrierVisibility;
}

interface CardDef {
  key: 'avg_rating' | 'poor_voice_pct' | 'call_drop_pct';
  label: string;
  direction: 'higherIsBetter' | 'lowerIsBetter';
  closeThreshold: number;
  render: (v: number | null) => string;
}

const CARDS: CardDef[] = [
  {
    key: 'avg_rating',
    label: 'Overall rating',
    direction: 'higherIsBetter',
    closeThreshold: 0.05,
    render: (v) => (v === null ? '—' : v.toFixed(2)),
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

export function ScoreCards({ kpis, carrierVisibility }: ScoreCardsProps) {
  const rows = kpis?.kpis ?? [];
  const airtel = rows.find((r) => r.operator === 'Airtel');
  const jio = rows.find((r) => r.operator === 'Jio');
  const bothVisible = carrierVisibility.Airtel && carrierVisibility.Jio;

  if (!airtel && !jio) {
    return (
      <div className="score-cards score-cards--empty">
        No reports match the current filters. Try widening the location or time range.
      </div>
    );
  }

  const valueFor = (row: KpiRow | undefined, key: CardDef['key']) => (row ? toNumber(row[key]) : null);

  return (
    <div className="score-cards">
      <div className="score-cards__grid">
        {CARDS.map((card) => {
          const airtelVal = valueFor(airtel, card.key);
          const jioVal = valueFor(jio, card.key);
          const cmp = bothVisible ? compareMetric(airtelVal, jioVal, card.direction, card.closeThreshold) : null;

          return (
            <div className="score-card" key={card.key}>
              <p className="score-card__label">{card.label}</p>
              <div className="score-card__rows">
                {carrierVisibility.Airtel && (
                  <div
                    className={`score-card__row ${cmp?.winner === 'Airtel' ? 'score-card__row--ahead' : ''}`}
                  >
                    <i className="score-card__dot" style={{ background: OPERATOR_COLOR.Airtel }} />
                    <span className="score-card__operator">Airtel</span>
                    <span className="score-card__value tabular">{card.render(airtelVal)}</span>
                  </div>
                )}
                {carrierVisibility.Jio && (
                  <div className={`score-card__row ${cmp?.winner === 'Jio' ? 'score-card__row--ahead' : ''}`}>
                    <i className="score-card__dot score-card__dot--dashed" style={{ background: OPERATOR_COLOR.Jio }} />
                    <span className="score-card__operator">Jio</span>
                    <span className="score-card__value tabular">{card.render(jioVal)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="score-cards__volume">
        Based on{' '}
        {carrierVisibility.Airtel && airtel && (
          <>
            <strong className="tabular">{formatMillions(airtel.total_reports)}</strong> Airtel
          </>
        )}
        {carrierVisibility.Airtel && carrierVisibility.Jio && airtel && jio && ' and '}
        {carrierVisibility.Jio && jio && (
          <>
            <strong className="tabular">{formatMillions(jio.total_reports)}</strong> Jio
          </>
        )}{' '}
        reports
        {bothVisible && airtel && jio && (
          <span
            className="score-cards__hint"
            tabIndex={0}
            title="Jio has many more reports than Airtel in this data, so comparisons may not be equally representative."
          >
            {' '}
            ⓘ
          </span>
        )}
        .
      </p>
    </div>
  );
}
