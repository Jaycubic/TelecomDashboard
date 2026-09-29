// Geometry source for the India overview. The backend now prefers the
// `vardhan-maps` state/UT GeoJSON package (current 36-state/UT catalogue).
// MAP_SOURCE_URL remains as a defensive remote fallback for older deployments
// where the package has not yet been installed.
const MAP_SOURCE_URL = process.env.MAP_SOURCE_URL ||
  'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@2884453/topojson/india.json';

module.exports = { MAP_SOURCE_URL };
