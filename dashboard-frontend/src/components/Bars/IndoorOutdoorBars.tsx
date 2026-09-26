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
import type { IndoorOutdoorResponse } from '../../types';
import { OPERATOR_COLOR } from '../../lib/constants';
import { toNumber } from '../../lib/format';
import type { CarrierVisibility } from '../../hooks/useDashboardState';
import './IndoorOutdoorBars.css';

interface IndoorOutdoorBarsProps {
  data: IndoorOutdoorResponse | null;
  carrierVisibility: CarrierVisibility;
}

export function IndoorOutdoorBars({ data, carrierVisibility }: IndoorOutdoorBarsProps) {
  const rows = data?.breakdown ?? [];
  if (rows.length === 0) {
    return <p className="io-bars__empty">No data for the current filters.</p>;
  }

  // Reshape into one row per inout bucket, with each operator's satisfactory %
  // as a separate series -- satisfactory rate is the headline "quality" number;
  // call-drop / poor-voice are available in the tooltip below.
  const chartData = ['Indoor', 'Outdoor'].map((inout) => {
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
          <CartesianGrid strokeDasharray="3 3" stroke="#E4E4DF" vertical={false} />
          <XAxis dataKey="inout" tick={{ fontSize: 12, fill: '#5A5E68' }} />
          <YAxis
            tick={{ fontSize: 12, fill: '#5A5E68' }}
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
