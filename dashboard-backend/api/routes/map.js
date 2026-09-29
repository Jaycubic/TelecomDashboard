const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { withCache } = require('../middleware/cache');
const { getSpatialCells } = require('../services/queries');
const { MAP_SOURCE_META } = require('../config/mapSource');

const LOCAL_STATE_TOPOJSON = path.join(__dirname, '..', 'data', 'india-states-topo.json');
let geometryCache = null;

function loadLocalGeometry() {
  if (geometryCache) return geometryCache;
  const topology = JSON.parse(fs.readFileSync(LOCAL_STATE_TOPOJSON, 'utf8'));
  geometryCache = {
    ...topology,
    source: {
      ...MAP_SOURCE_META,
      source: 'India Geodata — state/UT boundary snapshot',
      transport: 'bundled local TopoJSON',
      fallback: false,
    },
  };
  return geometryCache;
}

router.get('/india', withCache(async (req, res) => {
  res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  return loadLocalGeometry();
}, 86400));

router.get('/state-points', withCache(async (req) => {
  if (!req.query.state) {
    throw new Error('Invalid state: a state or union territory is required for the state map');
  }
  return getSpatialCells(req.query);
}, 300));

module.exports = router;
