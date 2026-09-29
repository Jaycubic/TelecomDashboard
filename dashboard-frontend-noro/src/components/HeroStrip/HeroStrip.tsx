import type { KpiResponse } from '../../types';
import type { CarrierVisibility } from '../../hooks/useDashboardState';
import { buildMetricSummaries } from '../../lib/analysis';
import { toNumber } from '../../lib/format';
import './HeroStrip.css';

interface HeroStripProps {
  kpis: KpiResponse | null;
  selectedState: string | undefined;
  loading: boolean;
  carrierVisibility: CarrierVisibility;
  onCarrierVisibilityChange: (visibility: CarrierVisibility) => void;
}

type ViewMode = 'compare' | 'Airtel' | 'Jio';

export function HeroStrip({
  kpis,
  selectedState,
  loading,
  carrierVisibility,
  onCarrierVisibilityChange,
}: HeroStripProps) {
  const metrics = buildMetricSummaries(kpis?.kpis ?? []);
  const rating = metrics.find((m) => m.key === 'avg_rating');
  const drops = metrics.find((m) => m.key === 'call_drop_pct');
  const poorVoice = metrics.find((m) => m.key === 'poor_voice_pct');
  const airtel = kpis?.kpis.find((r) => r.operator === 'Airtel');
  const jio = kpis?.kpis.find((r) => r.operator === 'Jio');
  const bothVisible = carrierVisibility.Airtel && carrierVisibility.Jio;
  const selectedOperator = carrierVisibility.Airtel ? 'Airtel' : 'Jio';
  const selectedRow = selectedOperator === 'Airtel' ? airtel : jio;
  const reports = bothVisible
    ? (toNumber(airtel?.total_reports) ?? 0) + (toNumber(jio?.total_reports) ?? 0)
    : toNumber(selectedRow?.total_reports) ?? 0;
  const scope = selectedState ? selectedState : 'All India';
  const viewMode: ViewMode = bothVisible ? 'compare' : selectedOperator;

  const title = 'Customer-reported voice experience';
  const subtitle = bothVisible
    ? 'Compare customer-reported voice-call quality, then explore where ratings differ by state.'
    : `Explore customer-reported ${selectedOperator} voice-call quality, then see how ratings vary by state.`;

  const setView = (mode: ViewMode) => {
    if (mode === 'compare') onCarrierVisibilityChange({ Airtel: true, Jio: true });
    else onCarrierVisibilityChange({ Airtel: mode === 'Airtel', Jio: mode === 'Jio' });
  };

  return (
    <section className="hero">
      <div className="hero__inner">
        <div className="hero__copy">
          <div className="section-kicker">
            {scope} · {bothVisible ? 'Comparing Airtel + Jio' : `Viewing ${selectedOperator}`}
          </div>
          <h1>{title}</h1>
          <p>{subtitle}</p>

          <div className="hero__network" role="group" aria-label="Choose a network view">
            <span className="filterbar__eyebrow">Network view</span>
            <div className="operator-toggle" role="group" aria-label="Choose a network view">
              <button
                type="button"
                className={`operator-toggle__btn operator-toggle__btn--jio ${viewMode === 'Jio' ? 'is-active' : ''}`}
                aria-pressed={viewMode === 'Jio'}
                onClick={() => setView('Jio')}
              >
                <span aria-hidden="true" />
                Jio only
              </button>
              <button
                type="button"
                className={`operator-toggle__btn operator-toggle__btn--airtel ${viewMode === 'Airtel' ? 'is-active' : ''}`}
                aria-pressed={viewMode === 'Airtel'}
                onClick={() => setView('Airtel')}
              >
                <span aria-hidden="true" />
                Airtel only
              </button>
              <button
                type="button"
                className={`operator-toggle__btn operator-toggle__btn--compare ${viewMode === 'compare' ? 'is-active' : ''}`}
                aria-pressed={viewMode === 'compare'}
                onClick={() => setView('compare')}
              >
                <span className="operator-toggle__compare-dots" aria-hidden="true"><i /><i /></span>
                Compare Airtel + Jio
              </button>
            </div>
          </div>
        </div>

        <div className="hero__facts" aria-label="Current data summary">
          <Fact strong={loading ? '—' : reports.toLocaleString('en-IN')} label="Customer reports" />
          <Fact
            strong={loading ? '—' : bothVisible
              ? `${rating?.airtel?.toFixed(2) ?? '—'} · ${rating?.jio?.toFixed(2) ?? '—'}`
              : `${selectedOperator} · ${ratingValue(selectedRow?.avg_rating)}`}
            label={bothVisible ? 'Average customer rating · Airtel / Jio' : 'Average customer rating'}
          />
          <Fact
            strong={loading ? '—' : bothVisible
              ? `${drops?.airtel?.toFixed(1) ?? '—'}% · ${drops?.jio?.toFixed(1) ?? '—'}%`
              : `${pctValue(selectedRow?.call_drop_pct)}`}
            label={bothVisible ? 'Dropped-call report share · Airtel / Jio' : 'Dropped-call report share'}
          />
          <Fact
            strong={loading ? '—' : bothVisible
              ? `${poorVoice?.airtel?.toFixed(1) ?? '—'}% · ${poorVoice?.jio?.toFixed(1) ?? '—'}%`
              : `${pctValue(selectedRow?.poor_voice_pct)}`}
            label={bothVisible ? 'Poor voice-quality report share · Airtel / Jio' : 'Poor voice-quality report share'}
          />
        </div>
      </div>
    </section>
  );
}

function Fact({ strong, label }: { strong: string; label: string }) {
  return (
    <div>
      <strong>{strong}</strong>
      <span>{label}</span>
    </div>
  );
}

function ratingValue(value: string | number | null | undefined) {
  const n = toNumber(value);
  return n == null ? '—' : `${n.toFixed(2)} / 5`;
}

function pctValue(value: string | number | null | undefined) {
  const n = toNumber(value);
  return n == null ? '—' : `${n.toFixed(1)}%`;
}
