// Canonical names shared by the official location filter, the map geometry,
// and the legacy spellings found in the supplied Airtel/Jio datasets.

const CANONICAL_BY_KEY: Record<string, string> = {
  'andaman & nicobar island': 'Andaman and Nicobar Islands',
  'andaman & nicobar islands': 'Andaman and Nicobar Islands',
  'andaman and nicobar': 'Andaman and Nicobar Islands',
  'andaman and nicobar islands': 'Andaman and Nicobar Islands',
  'andhra pradesh': 'Andhra Pradesh',
  'arunanchal pradesh': 'Arunachal Pradesh',
  'arunachal pradesh': 'Arunachal Pradesh',
  assam: 'Assam',
  bihar: 'Bihar',
  chandigarh: 'Chandigarh',
  chhattisgarh: 'Chhattisgarh',
  'dadara & nagar havelli': 'Dadra and Nagar Haveli and Daman and Diu',
  'dadra & nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'dadra and nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'dadra and nagar haveli and daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'daman & diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
  delhi: 'Delhi',
  'nct': 'Delhi',
  'nct of delhi': 'Delhi',
  'new delhi': 'Delhi',
  goa: 'Goa',
  gujarat: 'Gujarat',
  haryana: 'Haryana',
  'himachal pradesh': 'Himachal Pradesh',
  'jammu & kashmir': 'Jammu and Kashmir',
  'jammu and kashmir': 'Jammu and Kashmir',
  'j&k': 'Jammu and Kashmir',
  kashmir: 'Jammu and Kashmir',
  jharkhand: 'Jharkhand',
  karnataka: 'Karnataka',
  kerala: 'Kerala',
  ladakh: 'Ladakh',
  lakshadweep: 'Lakshadweep',
  madhya pradesh: 'Madhya Pradesh',
  maharashtra: 'Maharashtra',
  manipur: 'Manipur',
  meghalaya: 'Meghalaya',
  mizoram: 'Mizoram',
  nagaland: 'Nagaland',
  odisha: 'Odisha',
  orissa: 'Odisha',
  pondicherry: 'Puducherry',
  puducherry: 'Puducherry',
  punjab: 'Punjab',
  rajasthan: 'Rajasthan',
  sikkim: 'Sikkim',
  'tamil nadu': 'Tamil Nadu',
  telangana: 'Telangana',
  tripura: 'Tripura',
  'uttar pradesh': 'Uttar Pradesh',
  uttaranchal: 'Uttarakhand',
  uttarakhand: 'Uttarakhand',
  'west bengal': 'West Bengal',
};

export function normalizeAreaName(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  return CANONICAL_BY_KEY[key] ?? raw.trim();
}

// Kept as a compatibility export for existing imports.
export function toGeoJsonStateName(rawStateName: string): string {
  return normalizeAreaName(rawStateName);
}
