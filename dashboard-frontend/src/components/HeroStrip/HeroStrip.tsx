// src/components/HeroStrip/HeroStrip.tsx
// The first thing a user sees: who's winning nationally, and by how much.
import type { KpiResponse } from '../../types';
import { toNumber } from '../../lib/format';
import { compareMetric } from '../../lib/compare';
import './HeroStrip.css';

interface HeroStripProps {
  kpis: KpiResponse | null;
  selectedState: string | undefined;
  loading: boolean;
}

export function HeroStrip({ kpis, selectedState, loading }: HeroStripProps) {
  const airtel = kpis?.kpis.find((r) => r.operator === 'Airtel');
  const jio    = kpis?.kpis.find((r) => r.operator === 'Jio');

  // Overall winner: the operator ahead on 2+ of 3 metrics
  const ratingWin   = compareMetric(toNumber(airtel?.avg_rating), toNumber(jio?.avg_rating), 'higherIsBetter', 0.05);
  const dropWin     = compareMetric(toNumber(airtel?.call_drop_pct), toNumber(jio?.call_drop_pct), 'lowerIsBetter', 1);
  const voiceWin    = compareMetric(toNumber(airtel?.poor_voice_pct), toNumber(jio?.poor_voice_pct), 'lowerIsBetter', 1);

  const wins: Record<string, number> = { Airtel: 0, Jio: 0, tie: 0 };
  [ratingWin, dropWin, voiceWin].forEach((c) => { wins[c.winner] = (wins[c.winner] ?? 0) + 1; });

  const overallWinner: 'Airtel' | 'Jio' | 'tie' =
    wins['Airtel']! > wins['Jio']! ? 'Airtel' :
    wins['Jio']!   > wins['Airtel']! ? 'Jio' : 'tie';

  const scopeLabel = selectedState ? selectedState : 'All India';

  const ratingGap = (() => {
    const a = toNumber(airtel?.avg_rating);
    const j = toNumber(jio?.avg_rating);
    if (a === null || j === null) return null;
    return Math.abs(a - j).toFixed(2);
  })();

  const dropGap = (() => {
    const a = toNumber(airtel?.call_drop_pct);
    const j = toNumber(jio?.call_drop_pct);
    if (a === null || j === null) return null;
    return Math.abs(a - j).toFixed(1);
  })();

  const winnerLabel =
    overallWinner === 'tie' ? 'Similar quality' :
    overallWinner === 'Airtel' ? 'Airtel leads' : 'Jio leads';

  const winnerClass =
    overallWinner === 'Airtel' ? 'hero__verdict--airtel' :
    overallWinner === 'Jio'    ? 'hero__verdict--jio' : 'hero__verdict--tie';

  const subtext = overallWinner === 'tie'
    ? 'Neither operator has a clear edge on customer-reported call quality.'
    : ratingGap && dropGap
    ? `${overallWinner} is ahead on customer ratings and call drops in this period.`
    : 'Based on customer-reported voice quality data.';

  return (
    <div className="hero">
      <div className="hero__inner">
        <div className="hero__left">
          <p className="hero__scope">{scopeLabel}</p>
          <h1 className={`hero__verdict ${winnerClass} ${loading ? 'hero__verdict--loading' : ''}`}>
            {loading ? '\u00A0' : winnerLabel}
          </h1>
          <p className="hero__sub">{loading ? '\u00A0' : subtext}</p>
        </div>

        {!loading && airtel && jio && (
          <div className="hero__stats">
            <HeroStat
              label="Avg rating"
              airtelVal={toNumber(airtel.avg_rating)?.toFixed(2) ?? '—'}
              jioVal={toNumber(jio.avg_rating)?.toFixed(2) ?? '—'}
              winner={ratingWin.winner}
              unit="/ 5"
            />
            <HeroStat
              label="Call drops"
              airtelVal={toNumber(airtel.call_drop_pct)?.toFixed(1) + '%' ?? '—'}
              jioVal={toNumber(jio.call_drop_pct)?.toFixed(1) + '%' ?? '—'}
              winner={dropWin.winner}
              lowerBetter
            />
            <HeroStat
              label="Poor voice"
              airtelVal={toNumber(airtel.poor_voice_pct)?.toFixed(1) + '%' ?? '—'}
              jioVal={toNumber(jio.poor_voice_pct)?.toFixed(1) + '%' ?? '—'}
              winner={voiceWin.winner}
              lowerBetter
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface HeroStatProps {
  label: string;
  airtelVal: string;
  jioVal: string;
  winner: 'Airtel' | 'Jio' | 'tie';
  unit?: string;
  lowerBetter?: boolean;
}

function HeroStat({ label, airtelVal, jioVal, winner, unit }: HeroStatProps) {
  return (
    <div className="hero-stat">
      <p className="hero-stat__label">{label}</p>
      <div className="hero-stat__row">
        <span className={`hero-stat__val tabular ${winner === 'Airtel' ? 'hero-stat__val--winner' : ''}`}>
          <span className="hero-stat__swatch hero-stat__swatch--airtel" />
          {airtelVal}{unit && <span className="hero-stat__unit"> {unit}</span>}
        </span>
        <span className={`hero-stat__val tabular ${winner === 'Jio' ? 'hero-stat__val--winner' : ''}`}>
          <span className="hero-stat__swatch hero-stat__swatch--jio" />
          {jioVal}{unit && <span className="hero-stat__unit"> {unit}</span>}
        </span>
      </div>
    </div>
  );
}
