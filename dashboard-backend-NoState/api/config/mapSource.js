// A pinned, web-ready India state/UT TopoJSON source.
// It includes the current 36 state/UT units, including Ladakh and the merged
// Dadra & Nagar Haveli and Daman & Diu. The API proxies it server-side so the
// frontend does not depend on third-party CORS headers.
const MAP_SOURCE_URL = process.env.MAP_SOURCE_URL ||
  'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@2884453/topojson/india.json';

module.exports = { MAP_SOURCE_URL };
