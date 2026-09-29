// routes/kpis.js
const express = require('express');
const router = express.Router();
const { withCache } = require('../middleware/cache');
const { getKpis } = require('../services/queries');

// GET /api/kpis?operator=&region=&state=&year_start=&year_end=&inout=
router.get('/', withCache(async (req) => {
  return getKpis(req.query);
}));

module.exports = router;
