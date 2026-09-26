import { INDIA_STATE_FEATURES, buildProjection } from '../src/lib/geo';
import { buildStateFillMap } from '../src/lib/mapColor';
import { toGeoJsonStateName } from '../src/lib/stateNameMap';
import type { StateQualityRow, ConfidenceRow } from '../src/types';

console.log('== feature count ==');
console.log(INDIA_STATE_FEATURES.length, 'features (expect 36)');
if (INDIA_STATE_FEATURES.length !== 36) throw new Error('FAIL: wrong feature count');

console.log('== projection / path generation ==');
const { path } = buildProjection(640, 640);
const sample = INDIA_STATE_FEATURES.find(f => f.properties.ST_NM === 'Karnataka')!;
const d = path(sample.geometry as any);
console.log('Karnataka path length:', d?.length, '(expect > 100)');
if (!d || d.length < 100) throw new Error('FAIL: empty/short path for Karnataka');

console.log('== state name canonicalization matches backend ==');
// mirrors ingest.py's STATE_NAME_CANON -- must produce identical output
const backendCases: [string, string][] = [
  ['NCT', 'NCT of Delhi'],
  ['Delhi', 'NCT of Delhi'],
  ['Orissa', 'Odisha'],
  ['Pondicherry', 'Puducherry'],
  ['Uttaranchal', 'Uttarakhand'],
  ['Jammu and Kashmir', 'Jammu & Kashmir'],
  ['Andaman and Nicobar Islands', 'Andaman & Nicobar Island'],
  ['Dadra and Nagar Haveli', 'Dadara & Nagar Havelli'],
  ['Daman and Diu', 'Daman & Diu'],
  ['Arunachal Pradesh', 'Arunanchal Pradesh'],
  ['Karnataka', 'Karnataka'], // needs no translation
];
let allMatch = true;
for (const [input, expected] of backendCases) {
  const got = toGeoJsonStateName(input);
  const ok = got === expected;
  allMatch = allMatch && ok;
  console.log(`  ${ok ? 'OK ' : 'FAIL'}  "${input}" -> "${got}" (expected "${expected}")`);
}
if (!allMatch) throw new Error('FAIL: frontend/backend state name canonicalization mismatch');

console.log('== every canonical name from the map has a real feature ==');
const geoNames = new Set(INDIA_STATE_FEATURES.map(f => f.properties.ST_NM));
for (const [, expected] of backendCases) {
  if (!geoNames.has(expected)) throw new Error(`FAIL: "${expected}" has no matching map feature`);
}
console.log('  OK  all canonical targets exist as real map shapes');

console.log('== buildStateFillMap with synthetic data ==');
const stateRows: StateQualityRow[] = [
  { state_name: 'Karnataka', region: 'South', operator: 'Airtel', total_reports: 500, avg_rating: 4.2, call_drop_pct: 5, poor_voice_pct: 3 },
  { state_name: 'Karnataka', region: 'South', operator: 'Jio', total_reports: 8000, avg_rating: 3.8, call_drop_pct: 12, poor_voice_pct: 9 },
  { state_name: 'NCT of Delhi', region: 'North', operator: 'Jio', total_reports: 20, avg_rating: 3.5, call_drop_pct: 8, poor_voice_pct: 6 },
];
const confidenceRows: ConfidenceRow[] = [
  { state_name: 'NCT of Delhi', operator: 'Jio', total_reports: 20, confidence: 'low' },
];
const fillMap = buildStateFillMap(stateRows, confidenceRows, { Airtel: true, Jio: true });

const karnataka = fillMap.get('Karnataka');
console.log('Karnataka fill:', karnataka);
if (karnataka?.leadingOperator !== 'Airtel') throw new Error('FAIL: expected Airtel to lead Karnataka (lower drop+poor)');

const delhi = fillMap.get('NCT of Delhi');
console.log('Delhi fill:', delhi);
if (!delhi?.lowConfidence) throw new Error('FAIL: expected Delhi to be flagged low confidence');
if (delhi?.leadingOperator !== 'Jio') throw new Error('FAIL: expected Jio (only operator present) as leader for Delhi');

const noDataState = fillMap.get('Bihar');
console.log('Bihar (no rows) fill:', noDataState, '(expect undefined -- not in map at all)');

console.log('\nALL MAP-LOGIC CHECKS PASSED');
