// src/lib/mapColor.ts
import type { StateQualityRow, ConfidenceRow } from '../types';
import { OPERATOR_COLOR } from './constants';
import { toNumber } from './format';
import { toGeoJsonStateName } from './stateNameMap';

export interface StateFillResult {
  fill: string;
  opacity: number;
  hasData: boolean;
  lowConfidence: boolean;
  leadingOperator: 'Airtel' | 'Jio' | 'tie' | null;
}

const NO_DATA_FILL = '#E4E4DF';

/** A simple composite quality score: fewer call drops + less poor voice = higher score, 0-100. */
function qualityScore(row: StateQualityRow): number | null {
  const drop = toNumber(row.call_drop_pct);
  const poor = toNumber(row.poor_voice_pct);
  if (drop === null && poor === null) return null;
  const dropPart = drop ?? 0;
  const poorPart = poor ?? 0;
  return 100 - (dropPart + poorPart) / 2;
}

/**
 * Builds a lookup from GeoJSON ST_NM -> fill result, given the current
 * state-quality rows, confidence rows, and which carriers are toggled on.
 */
export function buildStateFillMap(
  stateRows: StateQualityRow[],
  confidenceRows: ConfidenceRow[],
  visibleCarriers: { Airtel: boolean; Jio: boolean },
): Map<string, StateFillResult> {
  const byGeoName = new Map<string, StateQualityRow[]>();
  for (const row of stateRows) {
    const geoName = toGeoJsonStateName(row.state_name);
    const list = byGeoName.get(geoName) ?? [];
    list.push(row);
    byGeoName.set(geoName, list);
  }

  const lowConfidenceByGeoName = new Set<string>();
  for (const c of confidenceRows) {
    if (c.confidence === 'low') {
      lowConfidenceByGeoName.add(toGeoJsonStateName(c.state_name));
    }
  }

  const result = new Map<string, StateFillResult>();

  for (const [geoName, rows] of byGeoName) {
    const airtelRow = rows.find((r) => r.operator === 'Airtel');
    const jioRow = rows.find((r) => r.operator === 'Jio');
    const airtelScore = visibleCarriers.Airtel && airtelRow ? qualityScore(airtelRow) : null;
    const jioScore = visibleCarriers.Jio && jioRow ? qualityScore(jioRow) : null;

    const lowConfidence = lowConfidenceByGeoName.has(geoName);

    if (airtelScore === null && jioScore === null) {
      result.set(geoName, {
        fill: NO_DATA_FILL,
        opacity: 1,
        hasData: false,
        lowConfidence,
        leadingOperator: null,
      });
      continue;
    }

    if (airtelScore !== null && jioScore !== null) {
      const gap = Math.abs(airtelScore - jioScore);
      const opacity = Math.min(0.9, 0.35 + gap / 40);
      const leader = airtelScore === jioScore ? 'tie' : airtelScore > jioScore ? 'Airtel' : 'Jio';
      result.set(geoName, {
        fill: leader === 'tie' ? '#9AA0A6' : OPERATOR_COLOR[leader],
        opacity,
        hasData: true,
        lowConfidence,
        leadingOperator: leader,
      });
      continue;
    }

    // only one carrier visible/available -- shade by its own absolute quality
    const soloOperator: 'Airtel' | 'Jio' = airtelScore !== null ? 'Airtel' : 'Jio';
    const soloScore = (airtelScore ?? jioScore)!;
    const opacity = Math.min(0.9, Math.max(0.25, soloScore / 100));
    result.set(geoName, {
      fill: OPERATOR_COLOR[soloOperator],
      opacity,
      hasData: true,
      lowConfidence,
      leadingOperator: soloOperator,
    });
  }

  return result;
}
