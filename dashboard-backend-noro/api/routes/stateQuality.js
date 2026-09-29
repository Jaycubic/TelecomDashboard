// routes/stateQuality.js
const express = require('express');
const router = express.Router();
const { withCache } = require('../middleware/cache');
const { getStateQuality, getSampleConfidence } = require('../services/queries');

// GET /api/state-quality?region=&year_start=&year_end=
router.get('/', withCache(async (req) => {
  return getStateQuality(req.query);
}));

// GET /api/state-quality/confidence?region=
// Sample-size flag per state/operator, for the "low n -- read with caution" UI treatment
router.get('/confidence', withCache(async (req) => {
  return getSampleConfidence(req.query);
}));

module.exports = router;
