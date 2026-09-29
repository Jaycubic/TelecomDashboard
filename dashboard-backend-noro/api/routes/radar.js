// routes/radar.js
const express = require('express');
const router = express.Router();
const { withCache } = require('../middleware/cache');
const { getRadarProfile } = require('../services/queries');

// GET /api/radar/:operator?region=&state=&year_start=&year_end=
// operator is a path param (Airtel|Jio) since the radar always compares
// exactly one operator's profile against the shared axes -- the frontend
// calls this twice (once per operator) and overlays the two shapes.
router.get('/:operator', withCache(async (req, res) => {
  const { operator } = req.params;
  if (!['Airtel', 'Jio'].includes(operator)) {
    res.status(400).json({ error: `operator must be 'Airtel' or 'Jio', got '${operator}'` });
    return; // withCache checks res.headersSent and bails out cleanly
  }
  return getRadarProfile(operator, req.query);
}));

module.exports = router;
