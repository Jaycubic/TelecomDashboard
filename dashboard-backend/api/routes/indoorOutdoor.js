// routes/indoorOutdoor.js
const express = require('express');
const router = express.Router();
const { withCache } = require('../middleware/cache');
const { getIndoorOutdoor } = require('../services/queries');

// GET /api/indoor-outdoor?operator=&region=&state=&year_start=&year_end=
router.get('/', withCache(async (req) => {
  return getIndoorOutdoor(req.query);
}));

module.exports = router;
