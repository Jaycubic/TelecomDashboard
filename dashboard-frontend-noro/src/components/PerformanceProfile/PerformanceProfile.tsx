import type { IndoorOutdoorResponse } from '../../types';
import type { CarrierVisibility } from '../../hooks/useDashboardState';
import { buildContextRows } from '../../lib/analysis';
import './PerformanceProfile.css';

interface PerformanceProfileProps {
  indoorOutdoor: IndoorOutdoorResponse | null;
  carrierVisibility: CarrierVisibility;
}

export function PerformanceProfile({ indoorOutdoor, carrierVisibility }: PerformanceProfileProps) {
  const rows = buildContextRows(indoorOutdoor);
  const bothVisible = carrierVisibility.Airtel && carrierVisibility.Jio;

  return (
    <section className="context-panel" aria-label="Reported call quality by setting">
      <div className="context-panel__header">
        <div>
          <div className="section-kicker">Call setting</div>
          <h2>How does reported call quality vary by setting?</h2>
          <p>Share of customer reports rated satisfactory when the call was made indoors or outdoors.</p>
        </div>
        {bothVisible && <div className="context-panel__legend"><span><i className="legend-dot legend-dot--jio" /> Jio</span><span><i className="legend-dot legend-dot--airtel" /> Airtel</span></div>}
      </div>

      <div className="grouped-chart" role="img" aria-label="Grouped bar chart comparing the share of customer reports rated satisfactory indoors and outdoors">
        {rows.map((row) => {
          const a = row.airtel ?? 0;
          const j = row.jio ?? 0;
          return (
            <div className="grouped-chart__group" key={row.inout}>
              <div className="grouped-chart__bars">
                {carrierVisibility.Jio && <ContextBar operator="Jio" value={row.jio} />}
                {carrierVisibility.Airtel && <ContextBar operator="Airtel" value={row.airtel} />}
              </div>
              <div className="grouped-chart__values">
                {carrierVisibility.Jio && <span>{j ? `${j.toFixed(0)}%` : '—'}</span>}
                {carrierVisibility.Airtel && <span>{a ? `${a.toFixed(0)}%` : '—'}</span>}
              </div>
              <strong>{row.inout}</strong>
            </div>
          );
        })}
        {!rows.length && <div className="context-empty">No context data for the current filters.</div>}
      </div>
      <p className="context-panel__note">These percentages describe customer reports rated satisfactory, not all calls.</p>
    </section>
  );
}

function ContextBar({ operator, value }: { operator: 'Airtel' | 'Jio'; value: number | null }) {
  return (
    <span className="grouped-bar" title={value == null ? `${operator}: no data` : `${operator}: ${value.toFixed(1)}%`}>
      <span className={`grouped-bar__fill grouped-bar__fill--${operator.toLowerCase()}`} style={{ height: value == null ? '0%' : `${Math.max(3, Math.min(100, value))}%` }} />
    </span>
  );
}
