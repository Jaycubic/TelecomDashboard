// src/components/PerformanceProfile/PerformanceProfile.tsx
// Full-width two-panel section: radar profile left, indoor/outdoor breakdown right.
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { RadarResponse, IndoorOutdoorResponse, InOut } from '../../types';
import type { CarrierVisibility } from '../../hooks/useDashboardState';
import type { ThemeMode } from '../../hooks/useTheme';
import { CHART_THEME, OPERATOR_COLOR } from '../../lib/constants';
import { toNumber } from '../../lib/format';
import './PerformanceProfile.css';

interface PerformanceProfileProps {
  radarAirtel: RadarResponse | null;
  radarJio: RadarResponse | null;
  indoorOutdoor: IndoorOutdoorResponse | null;
  carrierVisibility: CarrierVisibility;
  theme: ThemeMode;
}

const AXIS_LABELS: Record<string, string> = {
  rating: 'Rating',
  indoor_quality: 'Indoor',
  outdoor_quality: 'Outdoor',
  network_stability: 'Stability',
  voice_clarity: 'Voice clarity',
  coverage: 'Coverage',
};

function normalizeAxisValue(key: string, value: number | null): number {
  if (value === null) return 0;
  return key === 'rating' ? (value / 5) * 100 : value;
}

export function PerformanceProfile({
  radarAirtel,
  radarJio,
  indoorOutdoor,
  carrierVisibility,
  theme,
}: PerformanceProfileProps) {
  const colors = CHART_THEME[theme];

  const axisKeys = Object.keys(AXIS_LABELS);
  const radarData = axisKeys.map((key) => {
    const airtelRaw = radarAirtel?.axes[key as keyof RadarResponse['axes']] ?? null;
    const jioRaw    = radarJio?.axes[key as keyof RadarResponse['axes']] ?? null;
    return {
      axis: AXIS_LABELS[key],
      Airtel: normalizeAxisValue(key, airtelRaw),
      Jio:    normalizeAxisValue(key, jioRaw),
      airtelDisplay: airtelRaw,
      jioDisplay: jioRaw,
    };
  });

  // Indoor/outdoor bar data — satisfactory rate
  const ioRows = indoorOutdoor?.breakdown ?? [];
  const inoutCategories: InOut[] = ioRows.some((r) => r.inout === 'Travelling')
    ? ['Indoor', 'Outdoor', 'Travelling']
    : ['Indoor', 'Outdoor'];

  const ioData = inoutCategories.map((inout) => {
    const aRow = ioRows.find((r) => r.inout === inout && r.operator === 'Airtel');
    const jRow = ioRows.find((r) => r.inout === inout && r.operator === 'Jio');
    return {
      name: inout,
      Airtel: toNumber(aRow?.satisfactory_pct) ?? 0,
      Jio:    toNumber(jRow?.satisfactory_pct) ?? 0,
    };
  });

  const hasRadar = radarAirtel || radarJio;
  const hasIo    = ioRows.length > 0;

  return (
    <section className="perf-profile">
      {/* Radar */}
      <div className="perf-profile__panel">
        <div className="perf-profile__panel-header">
          <div>
            <h2 className="perf-profile__title">Performance profile</h2>
            <p className="perf-profile__sub">
              Six quality dimensions compared across both networks. Rating is scaled to 0–100 for comparison.
            </p>
          </div>
          <div className="perf-profile__legend">
            {carrierVisibility.Airtel && (
              <span className="perf-profile__legend-item perf-profile__legend-item--airtel">
                <span className="perf-profile__legend-line" />
                Airtel
              </span>
            )}
            {carrierVisibility.Jio && (
              <span className="perf-profile__legend-item perf-profile__legend-item--jio">
                <span className="perf-profile__legend-line perf-profile__legend-line--dashed" />
                Jio
              </span>
            )}
          </div>
        </div>

        {!hasRadar ? (
          <p className="perf-profile__empty">No data for current filters.</p>
        ) : (
          <div className="perf-profile__radar-wrap">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke={colors.grid} />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fontSize: 11, fill: colors.axis, fontFamily: 'Inter, sans-serif' }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 9, fill: colors.axis }}
                  tickCount={4}
                />
                {carrierVisibility.Airtel && (
                  <Radar
                    name="Airtel"
                    dataKey="Airtel"
                    stroke={OPERATOR_COLOR.Airtel}
                    fill={OPERATOR_COLOR.Airtel}
                    fillOpacity={0.12}
                    strokeWidth={2}
                  />
                )}
                {carrierVisibility.Jio && (
                  <Radar
                    name="Jio"
                    dataKey="Jio"
                    stroke={OPERATOR_COLOR.Jio}
                    fill={OPERATOR_COLOR.Jio}
                    fillOpacity={0.12}
                    strokeWidth={2}
                    strokeDasharray="5 3"
                  />
                )}
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface-1)',
                    border: '1px solid var(--color-border-strong)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--color-ink)',
                  }}
                  formatter={(_value, name, item) => {
                    const key = name === 'Airtel' ? 'airtelDisplay' : 'jioDisplay';
                    const raw = (item?.payload as Record<string, number | null>)?.[key];
                    return raw === null || raw === undefined ? '—' : raw.toFixed(1);
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Indoor / Outdoor */}
      <div className="perf-profile__panel">
        <div className="perf-profile__panel-header">
          <div>
            <h2 className="perf-profile__title">Indoor vs outdoor</h2>
            <p className="perf-profile__sub">
              Percentage of reports rated satisfactory, by where the call was made.
            </p>
          </div>
        </div>

        {!hasIo ? (
          <p className="perf-profile__empty">No data for current filters.</p>
        ) : (
          <div className="perf-profile__io-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ioData} margin={{ top: 8, right: 12, bottom: 0, left: -8 }} barSize={18} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: colors.axis, fontFamily: 'Inter, sans-serif' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: colors.axis }}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  width={38}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                  contentStyle={{
                    background: 'var(--color-surface-1)',
                    border: '1px solid var(--color-border-strong)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--color-ink)',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                />
                {carrierVisibility.Airtel && (
                  <Bar dataKey="Airtel" fill={OPERATOR_COLOR.Airtel} radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                )}
                {carrierVisibility.Jio && (
                  <Bar dataKey="Jio" fill={OPERATOR_COLOR.Jio} radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                )}
              </BarChart>
            </ResponsiveContainer>
            <p className="perf-profile__io-note">
              Building penetration and network coverage affect indoor quality differently from outdoor performance.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
