// India Geodata state/UT geometry source.
// Primary geometry comes from the public india-geodata repository maintained
// by yashveeeeeeer. The dashboard converts the repository's Admin2 shapefile
// to GeoJSON on the API server once and keeps it in memory for smooth SVG use.
// Source metadata: https://github.com/yashveeeeeeer/india-geodata

const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/yashveeeeeeer/india-geodata/main/data/administrative/states/datameet';

const MAP_SOURCE_URLS = Object.freeze({
  shp: process.env.MAP_SHP_URL || `${GITHUB_RAW_BASE}/Admin2.shp`,
  dbf: process.env.MAP_DBF_URL || `${GITHUB_RAW_BASE}/Admin2.dbf`,
});

const MAP_SOURCE_META = Object.freeze({
  source: 'India Geodata — States and Union Territories (DataMeet Admin2)',
  repository: 'https://github.com/yashveeeeeeer/india-geodata',
  dataset: 'data/administrative/states/datameet/Admin2.shp + Admin2.dbf',
  licence: 'See repository and dataset metadata; the states collection is documented as CC0-1.0 / CC-BY-4.0.',
});

module.exports = { MAP_SOURCE_URLS, MAP_SOURCE_META };
