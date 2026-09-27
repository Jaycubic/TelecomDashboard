import type { IndoorOutdoorResponse } from '../../types';
import type { CarrierVisibility } from '../../hooks/useDashboardState';
import { buildContextRows } from '../../lib/analysis';
import './PerformanceProfile.css';

interface PerformanceProfileProps {
  indoorOutdoor: IndoorOutdoorResponse | null;
  carrierVisibility: CarrierVisibility;
  theme: 'light' | 'dark';
}

export function PerformanceProfile({ indoorOutdoor, carrierVisibility }: PerformanceProfileProps) {
  const rows = buildContextRows(indoorOutdoor);

  return (
    <section className="context-panel">
      <div className="context-panel__header">
        <div>
          <div className="section-kicker">Context matters</div>
          <h2>Does the setting change the picture?</h2>
          <p>Satisfactory-call rate by where the customer reported making the call. This is a direct view of the API's context breakdown.</p>
        </div>
      </div>
      <div className="context-grid">
        {rows.map((row) => (
          <div className="context-row" key={row.inout}>
            <div className="context-row__label"><strong>{row.inout}</strong><span>{row.leader === 'Airtel' ? 'Airtel higher' : row.leader === 'Jio' ? 'Jio higher' : row.leader === 'similar' ? 'Similar' : 'Insufficient comparison'}</span></div>
            <div className="context-row__bars">
              {carrierVisibility.Airtel && <ContextBar operator="Airtel" value={row.airtel} />}
              {carrierVisibility.Jio && <ContextBar operator="Jio" value={row.jio} />}
            </div>
          </div>
        ))}
        {!rows.length && <div className="context-empty">No context data for the current filters.</div>}
      </div>
    </section>
  );
}

function ContextBar({ operator, value }: { operator: 'Airtel' | 'Jio'; value: number | null }) {
  return (
    <div className="context-bar">
      <div className="context-bar__head"><span><i className={`legend-dot legend-dot--${operator.toLowerCase()}`} />{operator}</span><b>{value == null ? '—' : `${value.toFixed(1)}%`}</b></div>
      <div className="context-bar__track"><span className={`context-bar__fill context-bar__fill--${operator.toLowerCase()}`} style={{ width: value == null ? '0%' : `${Math.max(2, Math.min(100, value))}%` }} /></div>
    </div>
  );
}
