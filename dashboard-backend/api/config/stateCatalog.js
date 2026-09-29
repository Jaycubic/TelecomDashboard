// Current India state / Union Territory catalogue used by the filter UI.
// The names follow the Government of India's current 28-state + 8-UT structure.

const STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttarakhand',
  'Uttar Pradesh',
  'West Bengal',
];

const UNION_TERRITORIES = [
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

// Dataset spellings observed in the supplied Airtel/Jio files.
const DATASET_ALIASES = {
  'Andaman and Nicobar Islands': ['Andaman & Nicobar Island', 'Andaman and Nicobar Islands'],
  'Delhi': ['NCT of Delhi', 'Delhi', 'NCT'],
  'Jammu and Kashmir': ['Jammu & Kashmir', 'Jammu and Kashmir', 'Kashmir'],
  'Puducherry': ['Puducherry', 'Pondicherry', 'Pondicherry'],
  'Dadra and Nagar Haveli and Daman and Diu': [
    'Dadara & Nagar Havelli',
    'Daman & Diu',
    'Dadra and Nagar Haveli',
    'Daman and Diu',
    'Dadra and Nagar Haveli and Daman and Diu',
  ],
  'Arunachal Pradesh': ['Arunanchal Pradesh', 'Arunachal Pradesh'],
  'Odisha': ['Odisha', 'Orissa'],
  'Uttarakhand': ['Uttarakhand', 'Uttaranchal'],
};

const canonicalAliasLookup = new Map();
for (const [canonical, aliases] of Object.entries(DATASET_ALIASES)) {
  for (const alias of aliases) canonicalAliasLookup.set(alias.toLowerCase(), canonical);
}

function aliasesFor(canonical) {
  return DATASET_ALIASES[canonical] ?? [canonical];
}

function canonicalizeDatasetState(raw) {
  const key = String(raw ?? '').trim().toLowerCase();
  return canonicalAliasLookup.get(key) ?? String(raw ?? '').trim();
}

module.exports = {
  STATES,
  UNION_TERRITORIES,
  DATASET_ALIASES,
  aliasesFor,
  canonicalizeDatasetState,
};
