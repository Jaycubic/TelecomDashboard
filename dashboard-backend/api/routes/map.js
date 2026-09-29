const express = require('express');
const router = express.Router();
const { MAP_SOURCE_URL } = require('../config/mapSource');
const { withCache } = require('../middleware/cache');
const { getSpatialCells } = require('../services/queries');

let cache = null;
let fetchedAt = 0;
const CACHE_MS = 24 * 60 * 60 * 1000;

let vardhanStatesPromise = null;
async function getVardhanStates() {
  if (!vardhanStatesPromise) {
    vardhanStatesPromise = import('vardhan-maps/data').then((module) => module.states);
  }
  return vardhanStatesPromise;
}

router.get('/india', async (req, res, next) => {
  try {
    const now = Date.now();
    if (cache && now - fetchedAt < CACHE_MS) {
      res.json(cache);
      return;
    }

    try {
      const stateFeatures = await getVardhanStates();
      cache = {
        source: 'Vardhan Maps — state/union-territory GeoJSON',
        licence: 'See Vardhan Maps / OpenStreetMap attribution. State/UT geometry is used; district geometry is intentionally not loaded.',
        state_features: stateFeatures,
      };
      fetchedAt = now;
      res.json(cache);
      return;
    } catch (vardhanError) {
      console.error('Vardhan state geometry unavailable, using fallback map source:', vardhanError.message);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let upstream;
    try {
      upstream = await fetch(MAP_SOURCE_URL, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    if (!upstream.ok) {
      throw new Error(`Map source returned HTTP ${upstream.status}`);
    }

    const topology = await upstream.json();
    cache = {
      source: 'India Maps Data / udit-001, pinned fallback TopoJSON snapshot',
      licence: 'See source repository for map-data provenance and licence.',
      topology,
    };
    fetchedAt = now;
    res.json(cache);
  } catch (err) {
    next(err);
  }
});

// GET /api/map/state-points?state=Maharashtra&year_start=2017&year_end=2025&operator=Airtel
// Returns server-aggregated GPS cells for the selected state. No district
// boundaries are exposed: cells are used only as a smooth coverage layer.
router.get('/state-points', withCache(async (req) => {
  if (!req.query.state) {
    throw new Error('Invalid state: a state or union territory is required for the state map');
  }
  return getSpatialCells(req.query);
}, 300));

module.exports = router;
