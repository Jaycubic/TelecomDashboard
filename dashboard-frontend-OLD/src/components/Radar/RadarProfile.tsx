// src/components/Radar/RadarProfile.tsx
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { RadarResponse } from '../../types';
import { OPERATOR_COLOR } from '../../lib/constants';
import type { CarrierVisibility } from '../../hooks/useDashboardState';
import './RadarProfile.css';

interface RadarProfileProps {
  radarAirtel: RadarResponse | null;
  radarJio: RadarResponse | null;
  carrierVisibility: CarrierVisibility;
}

const AXIS_LABELS: Record<string, string> = {
  rating: 'Rating',
  indoor_quality: 'Indoor quality',
  outdoor_quality: 'Outdoor quality',
  network_stability: 'Network stability',
  voice_clarity: 'Voice clarity',
  coverage: 'Coverage',
};

// Rating is on a 0-5 scale, everything else is a 0-100 percentage --
// normalize rating to the same 0-100 axis so one radar can show both
// without one axis looking artificially tiny.
function normalizeAxisValue(key: string, value: number | null): number {
  if (value === null) return 0;
  return key === 'rating' ? (value / 5) * 100 : value;
}

export function RadarProfile({ radarAirtel, radarJio, carrierVisibility }: RadarProfileProps) {
  if (!radarAirtel && !radarJio) {
    return <p className="radar-profile__empty">No data for the current filters.</p>;
  }

  const axisKeys = Object.keys(AXIS_LABELS);
  const chartData = axisKeys.map((key) => {
    const airtelRaw = radarAirtel?.axes[key as keyof RadarResponse['axes']] ?? null;
    const jioRaw = radarJio?.axes[key as keyof RadarResponse['axes']] ?? null;
    return {
      axis: AXIS_LABELS[key],
      Airtel: normalizeAxisValue(key, airtelRaw),
      Jio: normalizeAxisValue(key, jioRaw),
      airtelDisplay: airtelRaw,
      jioDisplay: jioRaw,
    };
  });

  return (
    <div className="radar-profile">
      <ResponsiveContainer width="100%" height={340}>
        <RadarChart data={chartData} outerRadius="72%">
          <PolarGrid stroke="#DCDCD6" />
          <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12, fill: '#5A5E68' }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#9aa0a6' }} />
          {carrierVisibility.Airtel && (
            <Radar
              name="Airtel"
              dataKey="Airtel"
              stroke={OPERATOR_COLOR.Airtel}
              fill={OPERATOR_COLOR.Airtel}
              fillOpacity={0.18}
              strokeWidth={2}
            />
          )}
          {carrierVisibility.Jio && (
            <Radar
              name="Jio"
              dataKey="Jio"
              stroke={OPERATOR_COLOR.Jio}
              fill={OPERATOR_COLOR.Jio}
              fillOpacity={0.18}
              strokeWidth={2}
              strokeDasharray="5 3"
            />
          )}
          <Legend />
          <Tooltip
            formatter={(_value, seriesName, item) => {
              const key = seriesName === 'Airtel' ? 'airtelDisplay' : 'jioDisplay';
              const raw = (item?.payload as { [k: string]: number | null })?.[key];
              return raw === null || raw === undefined ? '—' : raw.toFixed(1);
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
      <p className="radar-profile__note">
        Rating is shown on the same 0–100 scale as the other axes (rating ÷ 5 × 100) so
        one chart can compare all six dimensions. Jio's line is dashed as a second cue
        beyond color, for colorblind and grayscale readers.
      </p>
    </div>
  );
}
