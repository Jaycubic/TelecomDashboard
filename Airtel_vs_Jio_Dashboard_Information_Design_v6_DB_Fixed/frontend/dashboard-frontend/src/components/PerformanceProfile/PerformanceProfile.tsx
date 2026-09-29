import type { IndoorOutdoorResponse } from '../../types';
import type { CarrierVisibility } from '../../hooks/useDashboardState';
import { buildContextRows } from '../../lib/analysis';
import { InfoPopover } from '../InfoPopover/InfoPopover';
import './PerformanceProfile.css';

interface PerformanceProfileProps { indoorOutdoor: IndoorOutdoorResponse | null; carrierVisibility: CarrierVisibility; }

export function PerformanceProfile({ indoorOutdoor, carrierVisibility }: PerformanceProfileProps) {
  const rows = buildContextRows(indoorOutdoor);
  return (
    <section className="context-panel" aria-label="Satisfactory call rate by setting">
      <div className="context-panel__header">
        <div className="context-panel__title-row">
          <h2>Satisfactory call rate by setting</h2>
          <InfoPopover label="How satisfactory call rate by setting is calculated" align="right">
            <p className="info-popover__title">Setting breakdown</p>
            <p><strong>Measure:</strong> percentage of Indoor or Outdoor customer reviews classified as <strong>Satisfactory</strong>.</p>
            <p className="info-popover__formula"><strong>Formula:</strong> Satisfactory reviews in a setting ÷ all reviews in that setting × 100.</p>
            <p className="info-popover__note">The chart uses the source <strong>inout</strong> field. Travelling records are not included in this Indoor/Outdoor comparison.</p>
          </InfoPopover>
        </div>
        <div className="context-panel__legend" aria-label="Operator legend">
          {carrierVisibility.Airtel && <span><i className="legend-dot legend-dot--airtel" /> Airtel</span>}
          {carrierVisibility.Jio && <span><i className="legend-dot legend-dot--jio" /> Jio</span>}
        </div>
      </div>
      <div className="grouped-chart" role="img" aria-label={buildAriaLabel(rows, carrierVisibility)}>
        {rows.map((row) => (
          <div className="grouped-chart__group" key={row.inout}>
            <div className="grouped-chart__bars">
              {carrierVisibility.Airtel && <ContextBar operator="Airtel" value={row.airtel} />}
              {carrierVisibility.Jio && <ContextBar operator="Jio" value={row.jio} />}
            </div>
            <div className="grouped-chart__values">
              {carrierVisibility.Airtel && <span className="airtel">{row.airtel == null ? '—' : `${row.airtel.toFixed(1)}%`}</span>}
              {carrierVisibility.Jio && <span className="jio">{row.jio == null ? '—' : `${row.jio.toFixed(1)}%`}</span>}
            </div>
            <strong>{row.inout}</strong>
          </div>
        ))}
        {!rows.length && <div className="context-empty">No setting records are available for this selection.</div>}
      </div>
    </section>
  );
}

function ContextBar({ operator, value }: { operator: 'Airtel' | 'Jio'; value: number | null }) {
  const safe = value == null ? 0 : Math.max(0, Math.min(100, value));
  return <span className="grouped-bar" aria-hidden="true"><span className={`grouped-bar__fill grouped-bar__fill--${operator.toLowerCase()}`} style={{ height: safe ? `${Math.max(3, safe)}%` : '0%' }} /></span>;
}

function buildAriaLabel(rows: ReturnType<typeof buildContextRows>, visibility: CarrierVisibility) {
  const parts = rows.flatMap((row) => {
    const item = [`${row.inout}`];
    if (visibility.Airtel && row.airtel != null) item.push(`Airtel ${row.airtel.toFixed(1)} percent`);
    if (visibility.Jio && row.jio != null) item.push(`Jio ${row.jio.toFixed(1)} percent`);
    return item.join(', ');
  });
  return `Grouped bar chart of satisfactory call rate by setting. ${parts.join('; ')}`;
}
