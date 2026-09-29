import type {
  IndoorOutdoorResponse,
  KpiRow,
  StateQualityRow,
} from '../types';
import { toNumber } from './format';

export type Operator = 'Airtel' | 'Jio';

export interface MetricSummary {
  key: 'avg_rating' | 'call_drop_pct' | 'poor_voice_pct';
  label: string;
  description: string;
  unit: '/ 5' | '%';
  direction: 'higherIsBetter' | 'lowerIsBetter';
  airtel: number | null;
  jio: number | null;
  gap: number | null;
  leader: Operator | 'similar' | null;
}

export function metricLeader(
  airtel: number | null,
  jio: number | null,
  direction: 'higherIsBetter' | 'lowerIsBetter',
  threshold: number,
): Operator | 'similar' | null {
  if (airtel === null || jio === null) return null;
  const diff = direction === 'higherIsBetter' ? airtel - jio : jio - airtel;
  if (Math.abs(diff) < threshold) return 'similar';
  return diff > 0 ? 'Airtel' : 'Jio';
}

export function buildMetricSummaries(rows: KpiRow[]): MetricSummary[] {
  const airtel = rows.find((r) => r.operator === 'Airtel');
  const jio = rows.find((r) => r.operator === 'Jio');

  const defs: Array<{
    key: MetricSummary['key'];
    label: string;
    description: string;
    unit: MetricSummary['unit'];
    direction: MetricSummary['direction'];
    threshold: number;
  }> = [
    {
      key: 'avg_rating',
      label: 'Average rating',
      description: 'Customer-reported overall call quality score',
      unit: '/ 5',
      direction: 'higherIsBetter',
      threshold: 0.05,
    },
    {
      key: 'call_drop_pct',
      label: 'Dropped-call report share',
      description: 'Share of reports classified as dropped calls',
      unit: '%',
      direction: 'lowerIsBetter',
      threshold: 1,
    },
    {
      key: 'poor_voice_pct',
      label: 'Poor voice-quality report share',
      description: 'Share of reports classified as poor voice quality',
      unit: '%',
      direction: 'lowerIsBetter',
      threshold: 1,
    },
  ];

  return defs.map((def) => {
    const a = toNumber(airtel?.[def.key]);
    const j = toNumber(jio?.[def.key]);
    return {
      ...def,
      airtel: a,
      jio: j,
      gap: a === null || j === null ? null : Math.abs(a - j),
      leader: metricLeader(a, j, def.direction, def.threshold),
    };
  });
}

export interface StateGap {
  stateName: string;
  region: string | null;
  airtel: number | null;
  jio: number | null;
  gap: number | null;
  leader: Operator | 'similar' | null;
  reports: number;
}

export function buildStateGaps(rows: StateQualityRow[]): StateGap[] {
  const byState = new Map<string, StateQualityRow[]>();
  for (const row of rows) {
    const bucket = byState.get(row.state_name) ?? [];
    bucket.push(row);
    byState.set(row.state_name, bucket);
  }

  return [...byState.entries()]
    .map(([stateName, stateRows]) => {
      const a = stateRows.find((r) => r.operator === 'Airtel');
      const j = stateRows.find((r) => r.operator === 'Jio');
      const av = toNumber(a?.avg_rating);
      const jv = toNumber(j?.avg_rating);
      const gap = av === null || jv === null ? null : Math.abs(av - jv);
      return {
        stateName,
        region: a?.region ?? j?.region ?? null,
        airtel: av,
        jio: jv,
        gap,
        leader: metricLeader(av, jv, 'higherIsBetter', 0.05),
        reports: Math.round((toNumber(a?.total_reports) ?? 0) + (toNumber(j?.total_reports) ?? 0)),
      } satisfies StateGap;
    })
    .filter((row) => row.gap !== null)
    .sort((a, b) => (b.gap ?? 0) - (a.gap ?? 0));
}

export interface ContextRow {
  inout: 'Indoor' | 'Outdoor';
  airtel: number | null;
  jio: number | null;
  gap: number | null;
  leader: Operator | 'similar' | null;
}

export function buildContextRows(data: IndoorOutdoorResponse | null): ContextRow[] {
  const rows = data?.breakdown ?? [];
  const order: ContextRow['inout'][] = ['Indoor', 'Outdoor'];
  return order
    .map((inout) => {
      const a = rows.find((row) => row.inout === inout && row.operator === 'Airtel');
      const j = rows.find((row) => row.inout === inout && row.operator === 'Jio');
      const av = toNumber(a?.satisfactory_pct);
      const jv = toNumber(j?.satisfactory_pct);
      return {
        inout,
        airtel: av,
        jio: jv,
        gap: av === null || jv === null ? null : Math.abs(av - jv),
        leader: metricLeader(av, jv, 'higherIsBetter', 1),
      } satisfies ContextRow;
    })
    .filter((row) => row.airtel !== null || row.jio !== null);
}

export function formatDelta(
  airtel: number | null,
  jio: number | null,
  direction: 'higherIsBetter' | 'lowerIsBetter',
  digits = 1,
): string {
  if (airtel === null || jio === null) return '—';
  const raw = direction === 'higherIsBetter' ? airtel - jio : jio - airtel;
  if (Math.abs(raw) < 0.05) return 'Similar';
  const operator = raw > 0 ? 'Airtel' : 'Jio';
  const amount = Math.abs(raw).toFixed(digits);
  return `${operator} ${amount}${direction === 'higherIsBetter' && digits === 2 ? '' : ' pp'}`;
}
