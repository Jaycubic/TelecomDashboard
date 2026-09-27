import type { KpiResponse } from '../../types';
import type { CarrierVisibility } from '../../hooks/useDashboardState';
import { buildMetricSummaries } from '../../lib/analysis';
import './MetricPanel.css';

interface MetricPanelProps {
  kpis: KpiResponse | null;
  carrierVisibility: CarrierVisibility;
}

export function MetricPanel({ kpis, carrierVisibility }: MetricPanelProps) {
  const metrics = buildMetricSummaries(kpis?.kpis ?? []);

  return (
    <section className="comparison-panel">
      <div className="comparison-panel__header">
        <div>
          <div className="section-kicker">National snapshot</div>
          <h2>Three signals, one view</h2>
          <p>Exact values from the current filters. Differences are shown in percentage points for rate metrics.</p>
        </div>
      </div>

      <div className="metric-list">
        {metrics.map((metric) => {
          const max = metric.key === 'avg_rating' ? 5 : 100;
          const aWidth = metric.airtel === null ? 0 : Math.max(3, (metric.airtel / max) * 100);
          const jWidth = metric.jio === null ? 0 : Math.max(3, (metric.jio / max) * 100);
          const delta = metric.gap === null ? '—' : metric.key === 'avg_rating' ? metric.gap.toFixed(2) : `${metric.gap.toFixed(1)} pp`;
          const leaderText = metric.leader === 'Airtel' ? 'Airtel higher' : metric.leader === 'Jio' ? 'Jio lower' : metric.leader === 'similar' ? 'Similar' : '—';
          const leaderClass = metric.leader === 'Airtel' ? 'airtel' : metric.leader === 'Jio' ? 'jio' : '';
          return (
            <div className="metric-row" key={metric.key}>
              <div className="metric-row__head">
                <div>
                  <strong>{metric.label}</strong>
                  <span>{metric.description}</span>
                </div>
                <div className={`metric-row__delta ${leaderClass}`}>
                  <b>{delta}</b>
                  <small>{leaderText}</small>
                </div>
              </div>
              <div className="metric-row__values">
                {carrierVisibility.Airtel && (
                  <div className="metric-row__series">
                    <div className="metric-row__series-head"><span className="series-name"><i className="legend-dot legend-dot--airtel" />Airtel</span><b>{metric.airtel == null ? '—' : `${metric.airtel.toFixed(metric.key === 'avg_rating' ? 2 : 1)}${metric.unit}`}</b></div>
                    <div className="metric-track"><span className="metric-fill metric-fill--airtel" style={{ width: `${aWidth}%` }} /></div>
                  </div>
                )}
                {carrierVisibility.Jio && (
                  <div className="metric-row__series">
                    <div className="metric-row__series-head"><span className="series-name"><i className="legend-dot legend-dot--jio" />Jio</span><b>{metric.jio == null ? '—' : `${metric.jio.toFixed(metric.key === 'avg_rating' ? 2 : 1)}${metric.unit}`}</b></div>
                    <div className="metric-track"><span className="metric-fill metric-fill--jio" style={{ width: `${jWidth}%` }} /></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
