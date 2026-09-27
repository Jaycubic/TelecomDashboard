import type { KpiResponse } from '../../types';
import { buildMetricSummaries } from '../../lib/analysis';
import { toNumber } from '../../lib/format';
import './HeroStrip.css';

interface HeroStripProps {
  kpis: KpiResponse | null;
  selectedState: string | undefined;
  loading: boolean;
}

export function HeroStrip({ kpis, selectedState, loading }: HeroStripProps) {
  const metrics = buildMetricSummaries(kpis?.kpis ?? []);
  const rating = metrics.find((m) => m.key === 'avg_rating');
  const drops = metrics.find((m) => m.key === 'call_drop_pct');
  const poorVoice = metrics.find((m) => m.key === 'poor_voice_pct');
  const a = kpis?.kpis.find((r) => r.operator === 'Airtel');
  const j = kpis?.kpis.find((r) => r.operator === 'Jio');
  const reports = (toNumber(a?.total_reports) ?? 0) + (toNumber(j?.total_reports) ?? 0);
  const scope = selectedState ? selectedState : 'All India';

  return (
    <section className="hero">
      <div className="hero__inner">
        <div className="hero__copy">
          <div className="section-kicker">{scope} · {a && j ? 'Airtel + Jio' : 'Current data'}</div>
          <h1>How different does call quality feel between Airtel and Jio?</h1>
          <p>Start with the national snapshot, then move to the map to see where customer-reported ratings diverge.</p>
        </div>
        <div className="hero__facts" aria-label="Current dataset scope">
          <div><strong>{loading ? '—' : reports.toLocaleString('en-IN')}</strong><span>reports</span></div>
          <div><strong>{loading ? '—' : `${rating?.airtel?.toFixed(2) ?? '—'} / ${rating?.jio?.toFixed(2) ?? '—'}`}</strong><span>rating · Airtel / Jio</span></div>
          <div><strong>{loading ? '—' : `${drops?.airtel?.toFixed(1) ?? '—'} / ${drops?.jio?.toFixed(1) ?? '—'}%`}</strong><span>call drops · Airtel / Jio</span></div>
          <div><strong>{loading ? '—' : `${poorVoice?.airtel?.toFixed(1) ?? '—'} / ${poorVoice?.jio?.toFixed(1) ?? '—'}%`}</strong><span>poor voice · Airtel / Jio</span></div>
        </div>
      </div>
    </section>
  );
}
