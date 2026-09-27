// src/lib/format.ts

/** node-pg returns NUMERIC/BIGINT columns as strings; coerce safely. */
export function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export function formatPct(value: string | number | null | undefined, digits = 1): string {
  const n = toNumber(value);
  return n === null ? '—' : `${n.toFixed(digits)}%`;
}

export function formatNumber(value: string | number | null | undefined): string {
  const n = toNumber(value);
  return n === null ? '—' : n.toLocaleString('en-IN');
}

export function formatMillions(value: string | number | null | undefined): string {
  const n = toNumber(value);
  if (n === null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('en-IN');
}
