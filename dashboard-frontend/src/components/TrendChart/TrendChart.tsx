import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TrendResponse } from '../../types';
import type { CarrierVisibility } from '../../hooks/useDashboardState';
import type { ThemeMode } from '../../hooks/useTheme';
import { OPERATOR_COLOR, CHART_THEME } from '../../lib/constants';
import { InfoPopover } from '../InfoPopover/InfoPopover';
import './TrendChart.css';

interface TrendChartProps { trend: TrendResponse | null; carrierVisibility: CarrierVisibility; yearRange: [number, number]; theme: ThemeMode; }

export function TrendChart({ trend, carrierVisibility, yearRange, theme }: TrendChartProps) {
  const monthly = yearRange[0] === yearRange[1];
  const keyed = new Map<string, { period: string; Airtel: number | null; Jio: number | null }>();
  for (const point of trend?.points ?? []) {
    const key = monthly ? String(point.month) : String(point.year);
    const row = keyed.get(key) ?? { period: monthly ? monthLabel(point.month) : String(point.year), Airtel: null, Jio: null };
    if (point.operator === 'Airtel') row.Airtel = point.satisfactory_pct == null ? null : Number(point.satisfactory_pct);
    if (point.operator === 'Jio') row.Jio = point.satisfactory_pct == null ? null : Number(point.satisfactory_pct);
    keyed.set(key, row);
  }
  const data = [...keyed.entries()].sort(([a], [b]) => Number(a) - Number(b)).map(([, row]) => row);
  const visible = data.filter((row) => (carrierVisibility.Airtel ? row.Airtel != null : true) || (carrierVisibility.Jio ? row.Jio != null : true));
  const noData = visible.length === 0;
  const chartTheme = CHART_THEME[theme];
  const periodLabel = monthly ? `Monthly · ${yearRange[0]}` : `Annual · ${yearRange[0]}–${yearRange[1]}`;

  return (
    <section className="trend-card" aria-label="Satisfactory call rate over time">
      <div className="trend-card__header">
        <div className="trend-card__title-row">
          <h2>Satisfactory call rate over time</h2>
          <InfoPopover label="How the time trend is calculated" align="right">
            <p className="info-popover__title">Trend interpretation</p>
            <p><strong>Measure:</strong> percentage of customer reviews classified as <strong>Satisfactory</strong> in each period.</p>
            <p>{monthly ? 'Both year handles are on the same year, so monthly records are shown.' : 'The handles cover more than one year, so one annual value is shown for each selected year.'}</p>
            <p className="info-popover__note">A blank period means no records were available under the selected filters. It is not treated as zero.</p>
          </InfoPopover>
        </div>
        <div className="trend-card__legend">
          {carrierVisibility.Airtel && <span><i className="trend-dot trend-dot--airtel" /> Airtel</span>}
          {carrierVisibility.Jio && <span><i className="trend-dot trend-dot--jio" /> Jio</span>}
        </div>
      </div>
      <div className="trend-card__period">{periodLabel}</div>
      <div className="trend-card__chart" role="img" aria-label={buildAriaLabel(visible, carrierVisibility, periodLabel)}>
        {noData ? <div className="trend-card__empty"><strong>No trend records for this selection.</strong><span>Try another location or year.</span></div> : (
          <ResponsiveContainer width="100%" height={138}>
            <LineChart data={visible} margin={{ top: 7, right: 7, bottom: 1, left: -21 }}>
              <CartesianGrid stroke={chartTheme.grid} vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 8, fill: chartTheme.axis, fontFamily: 'Inter, sans-serif' }} tickLine={false} axisLine={false} minTickGap={10} />
              <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 7.7, fill: chartTheme.axis, fontFamily: 'Inter, sans-serif' }} tickLine={false} axisLine={false} width={36} />
              <Tooltip contentStyle={{ background: 'var(--color-surface-1)', border: '1px solid var(--color-border-strong)', borderRadius: 8, fontSize: 9 }} formatter={(value: any, name: any) => [value == null ? '—' : `${Number(value).toFixed(1)}%`, String(name)]} />
              {carrierVisibility.Airtel && <Line type="monotone" connectNulls={false} dataKey="Airtel" stroke={OPERATOR_COLOR.Airtel} strokeWidth={2} dot={{ r: 2.2, fill: OPERATOR_COLOR.Airtel }} activeDot={{ r: 3.5 }} />}
              {carrierVisibility.Jio && <Line type="monotone" connectNulls={false} dataKey="Jio" stroke={OPERATOR_COLOR.Jio} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 2.2, fill: OPERATOR_COLOR.Jio }} activeDot={{ r: 3.5 }} />}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
function monthLabel(month: number | null) { const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return month == null ? '—' : labels[Math.max(1, Math.min(12, month)) - 1] ?? '—'; }
function buildAriaLabel(data: Array<{ period: string; Airtel: number | null; Jio: number | null }>, visibility: CarrierVisibility, label: string) { return `Line chart of satisfactory call rate, ${label}. ${data.map((row) => { const p = [row.period]; if (visibility.Airtel && row.Airtel != null) p.push(`Airtel ${row.Airtel.toFixed(1)} percent`); if (visibility.Jio && row.Jio != null) p.push(`Jio ${row.Jio.toFixed(1)} percent`); return p.join(', '); }).join('; ')}`; }
