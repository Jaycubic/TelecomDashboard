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
  const bothVisible = carrierVisibility.Airtel && carrierVisibility.Jio;
  const selectedOperator = carrierVisibility.Airtel ? 'Airtel' : 'Jio';

  return (
    <section className="comparison-panel">
      <div className="metric-list">
        {metrics.map((metric) => {
          const max = metric.key === 'avg_rating' ? 5 : 100;
          const aWidth = metric.airtel === null ? 0 : Math.max(3, (metric.airtel / max) * 100);
          const jWidth = metric.jio === null ? 0 : Math.max(3, (metric.jio / max) * 100);
          const delta = metric.gap === null
            ? '—'
            : metric.key === 'avg_rating'
              ? metric.gap.toFixed(2)
              : `${metric.gap.toFixed(1)} pp`;
          const leaderText = bothVisible
            ? metric.leader === 'Airtel'
              ? metric.key === 'avg_rating' ? 'Airtel higher rating' : 'Airtel lower share'
              : metric.leader === 'Jio'
                ? metric.key === 'avg_rating' ? 'Jio higher rating' : 'Jio lower share'
                : metric.leader === 'similar' ? 'Similar' : 'No comparison'
            : `${selectedOperator} only`;
          const leaderClass = metric.leader === 'Airtel' ? 'airtel' : metric.leader === 'Jio' ? 'jio' : '';
          const deltaText = bothVisible
            ? metric.key === 'avg_rating'
              ? `${delta} point${delta === '1.00' ? '' : 's'}`
              : delta
            : metric.key === 'avg_rating'
              ? `${metric.airtel != null && selectedOperator === 'Airtel' ? metric.airtel.toFixed(2) : metric.jio != null ? metric.jio.toFixed(2) : '—'} / 5`
              : selectedOperator === 'Airtel'
                ? `${metric.airtel?.toFixed(1) ?? '—'}%`
                : `${metric.jio?.toFixed(1) ?? '—'}%`;

          return (
            <div className="metric-row" key={metric.key}>
              <div className="metric-row__head">
                <div>
                  <strong>{metric.label}</strong>
                  <span>{metric.description}</span>
                </div>
                <div className={`metric-row__delta ${leaderClass}`}>
                  <b>{deltaText}</b>
                  <small>{leaderText}</small>
                </div>
              </div>
              <div className="metric-row__values">
                {carrierVisibility.Airtel && (
                  <div className={`metric-row__series ${!bothVisible && selectedOperator === 'Airtel' ? 'is-primary' : ''}`}>
                    <div className="metric-row__series-head"><span className="series-name"><i className="legend-dot legend-dot--airtel" />Airtel</span><b>{metric.airtel == null ? '—' : `${metric.airtel.toFixed(metric.key === 'avg_rating' ? 2 : 1)}${metric.unit}`}</b></div>
                    <div className="metric-track"><span className="metric-fill metric-fill--airtel" style={{ width: `${aWidth}%` }} /></div>
                  </div>
                )}
                {carrierVisibility.Jio && (
                  <div className={`metric-row__series ${!bothVisible && selectedOperator === 'Jio' ? 'is-primary' : ''}`}>
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
