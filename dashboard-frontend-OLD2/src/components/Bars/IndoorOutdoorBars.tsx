// src/components/Bars/IndoorOutdoorBars.tsx
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { IndoorOutdoorResponse, InOut } from '../../types';
import { CHART_THEME, OPERATOR_COLOR } from '../../lib/constants';
import { toNumber } from '../../lib/format';
import type { CarrierVisibility } from '../../hooks/useDashboardState';
import type { ThemeMode } from '../../hooks/useTheme';
import './IndoorOutdoorBars.css';

interface IndoorOutdoorBarsProps {
  data: IndoorOutdoorResponse | null;
  carrierVisibility: CarrierVisibility;
  theme: ThemeMode;
}

export function IndoorOutdoorBars({ data, carrierVisibility, theme }: IndoorOutdoorBarsProps) {
  const colors = CHART_THEME[theme];
  const rows = data?.breakdown ?? [];
  if (rows.length === 0) {
    return <p className="io-bars__empty">No data for the current filters.</p>;
  }

  // Reshape into one row per inout bucket, with each operator's satisfactory %
  // as a separate series -- satisfactory rate is the headline "quality" number;
  // call-drop / poor-voice are available in the tooltip below.
  const inoutCategories: InOut[] = rows.some((r) => r.inout === 'Travelling')
    ? ['Indoor', 'Outdoor', 'Travelling']
    : ['Indoor', 'Outdoor'];

  const chartData = inoutCategories.map((inout) => {
    const airtelRow = rows.find((r) => r.inout === inout && r.operator === 'Airtel');
    const jioRow = rows.find((r) => r.inout === inout && r.operator === 'Jio');
    return {
      inout,
      Airtel: toNumber(airtelRow?.satisfactory_pct) ?? 0,
      Jio: toNumber(jioRow?.satisfactory_pct) ?? 0,
      airtelN: airtelRow?.total_reports,
      jioN: jioRow?.total_reports,
    };
  });

  return (
    <div className="io-bars">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
          <XAxis dataKey="inout" tick={{ fontSize: 12, fill: colors.axis }} />
          <YAxis
            tick={{ fontSize: 12, fill: colors.axis }}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            width={40}
          />
          <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
          <Legend />
          {carrierVisibility.Airtel && (
            <Bar dataKey="Airtel" fill={OPERATOR_COLOR.Airtel} radius={[3, 3, 0, 0]} />
          )}
          {carrierVisibility.Jio && (
            <Bar dataKey="Jio" fill={OPERATOR_COLOR.Jio} radius={[3, 3, 0, 0]} />
          )}
        </BarChart>
      </ResponsiveContainer>
      <p className="io-bars__note">Bars show the % of reports rated "Satisfactory," indoor vs outdoor.</p>
    </div>
  );
}
