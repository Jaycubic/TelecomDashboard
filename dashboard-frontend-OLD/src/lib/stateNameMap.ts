// src/lib/stateNameMap.ts
//
// The Airtel/Jio sheets and the DataMeet GeoJSON don't spell every state
// the same way (confirmed directly: the Jio sample uses "NCT" for Delhi,
// the GeoJSON calls it "NCT of Delhi"). This maps every dataset spelling
// we've seen (plus the common variants worth guarding against) to the
// canonical `ST_NM` value used in src/data/india-states-topo.json.
//
// If you load your full dataset and a state stops appearing on the map,
// it means a spelling here doesn't match -- check ingestion/unmapped_states.log's
// sibling problem (this is the same class of issue, just for the map join
// instead of the region lookup) and add the missing variant below rather
// than silently dropping the state.

export const DATASET_TO_GEOJSON_STATE_NAME: Record<string, string> = {
  'nct': 'NCT of Delhi',
  'delhi': 'NCT of Delhi',
  'nct of delhi': 'NCT of Delhi',
  'new delhi': 'NCT of Delhi',

  'orissa': 'Odisha',
  'odisha': 'Odisha',

  'pondicherry': 'Puducherry',
  'puducherry': 'Puducherry',

  'uttaranchal': 'Uttarakhand',
  'uttarakhand': 'Uttarakhand',

  'jammu and kashmir': 'Jammu & Kashmir',
  'jammu & kashmir': 'Jammu & Kashmir',
  'j&k': 'Jammu & Kashmir',

  'andaman and nicobar islands': 'Andaman & Nicobar Island',
  'andaman & nicobar islands': 'Andaman & Nicobar Island',
  'andaman and nicobar': 'Andaman & Nicobar Island',

  'dadra and nagar haveli': 'Dadara & Nagar Havelli',
  'dadra & nagar haveli': 'Dadara & Nagar Havelli',
  'dadra and nagar haveli and daman and diu': 'Dadara & Nagar Havelli',

  'daman and diu': 'Daman & Diu',
  'daman & diu': 'Daman & Diu',

  'arunachal pradesh': 'Arunanchal Pradesh', // GeoJSON has this typo upstream in DataMeet's source
};

/**
 * Look up the canonical GeoJSON ST_NM for a raw dataset state_name.
 * Falls back to the input unchanged if it already matches a GeoJSON name
 * (most states, e.g. "Karnataka", need no translation at all).
 */
export function toGeoJsonStateName(rawStateName: string): string {
  const key = rawStateName.trim().toLowerCase();
  return DATASET_TO_GEOJSON_STATE_NAME[key] ?? rawStateName.trim();
}
