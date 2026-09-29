// src/lib/compare.ts
// Shared "who's ahead on this metric" logic, so the comparison table and
// any other component that needs a verdict use the exact same rule for
// what counts as a real lead vs. a wash.

export type MetricDirection = 'higherIsBetter' | 'lowerIsBetter';

export interface ComparisonResult {
  winner: 'Airtel' | 'Jio' | 'tie';
  isClose: boolean;
}

/**
 * Decide which operator is ahead on a metric, and whether the gap is small
 * enough to call it a wash rather than a real lead.
 * @param closeThreshold gap size, in the metric's own units (percentage
 *   points, or rating points on a 0-5 scale), below which we call it a tie.
 */
export function compareMetric(
  airtel: number | null,
  jio: number | null,
  direction: MetricDirection,
  closeThreshold: number,
): ComparisonResult {
  if (airtel === null || jio === null) return { winner: 'tie', isClose: true };
  const diff = direction === 'higherIsBetter' ? airtel - jio : jio - airtel;
  const isClose = Math.abs(diff) < closeThreshold;
  if (isClose) return { winner: 'tie', isClose: true };
  return { winner: diff > 0 ? 'Airtel' : 'Jio', isClose: false };
}