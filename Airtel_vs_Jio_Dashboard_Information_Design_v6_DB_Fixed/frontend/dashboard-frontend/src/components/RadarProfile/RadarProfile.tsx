import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { RadarResponse } from '../../types';
import type { CarrierVisibility } from '../../hooks/useDashboardState';
import type { ThemeMode } from '../../hooks/useTheme';
import { CHART_THEME, OPERATOR_COLOR } from '../../lib/constants';
import './RadarProfile.css';

interface RadarProfileProps {
  radarAirtel: RadarResponse | null;
  radarJio: RadarResponse | null;
  carrierVisibility: CarrierVisibility;
  theme: ThemeMode;
}

const AXIS_LABELS: Record<keyof RadarResponse['axes'], string> = {
  rating: 'Average rating',
  indoor_quality: 'Indoor',
  outdoor_quality: 'Outdoor',
  network_stability: 'Stability',
  voice_clarity: 'Voice clarity',
  coverage: 'Coverage',
};

function normalize(key: keyof RadarResponse['axes'], value: number | null) {
  if (value === null) return 0;
  return key === 'rating' ? (value / 5) * 100 : value;
}

export function RadarProfile({ radarAirtel, radarJio, carrierVisibility, theme }: RadarProfileProps) {
  const chartTheme = CHART_THEME[theme];
  const keys = Object.keys(AXIS_LABELS) as Array<keyof RadarResponse['axes']>;
  const data = keys.map((key) => ({
    axis: AXIS_LABELS[key],
    Airtel: normalize(key, radarAirtel?.axes[key] ?? null),
    Jio: normalize(key, radarJio?.axes[key] ?? null),
    airtelRaw: radarAirtel?.axes[key] ?? null,
    jioRaw: radarJio?.axes[key] ?? null,
  }));

  const hasData = Boolean(radarAirtel || radarJio);

  return (
    <section className="radar-profile" aria-label="Voice-quality profile">
      <div className="radar-profile__head">
        <div>
          <div className="section-kicker">Voice-quality profile</div>
          <h2>Reported voice experience across six measures</h2>
          <p>Compare six reported quality measures on a common 0–100 visual scale. The rating measure is normalized from 0–5.</p>
        </div>
        <div className="radar-profile__legend" aria-label="Performance profile legend">
          {carrierVisibility.Airtel && <span><i className="radar-profile__dot radar-profile__dot--airtel" />Airtel</span>}
          {carrierVisibility.Jio && <span><i className="radar-profile__dot radar-profile__dot--jio" />Jio</span>}
        </div>
      </div>

      <div className="radar-profile__body">
        {!hasData ? (
          <div className="radar-profile__empty">No profile data for the current filters.</div>
        ) : (
          <ResponsiveContainer width="100%" height={176}>
            <RadarChart data={data} outerRadius="64%" margin={{ top: 2, right: 4, bottom: 0, left: 4 }}>
              <PolarGrid stroke={chartTheme.grid} />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fontSize: 10, fill: chartTheme.axis, fontFamily: 'Inter, sans-serif' }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              {carrierVisibility.Airtel && (
                <Radar
                  name="Airtel"
                  dataKey="Airtel"
                  stroke={OPERATOR_COLOR.Airtel}
                  fill={OPERATOR_COLOR.Airtel}
                  fillOpacity={0.10}
                  strokeWidth={2.2}
                  dot={false}
                />
              )}
              {carrierVisibility.Jio && (
                <Radar
                  name="Jio"
                  dataKey="Jio"
                  stroke={OPERATOR_COLOR.Jio}
                  fill={OPERATOR_COLOR.Jio}
                  fillOpacity={0.10}
                  strokeWidth={2.2}
                  strokeDasharray="5 3"
                  dot={false}
                />
              )}
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface-1)',
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: 10,
                  fontSize: 11,
                  color: 'var(--color-ink)',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="radar-profile__foot">
        <span>{radarAirtel ? `${radarAirtel.sample_size.toLocaleString('en-IN')} Airtel reports` : 'Airtel —'}</span>
        <span>{radarJio ? `${radarJio.sample_size.toLocaleString('en-IN')} Jio reports` : 'Jio —'}</span>
      </div>
    </section>
  );
}
