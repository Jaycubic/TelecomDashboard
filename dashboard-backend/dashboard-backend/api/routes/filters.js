// routes/filters.js
// Drives the "Global Filters & Controls" sidebar: region toggle, state
// dropdown, year range slider. Pulled from the loaded data itself so the
// UI never lists a state or year that isn't actually in the dataset.
const express = require('express');
const router = express.Router();
const { withCache } = require('../middleware/cache');
const pool = require('../config/db');

// GET /api/filters/options
router.get('/options', withCache(async () => {
  const sql = `
    SELECT
      ARRAY_AGG(DISTINCT region ORDER BY region) FILTER (WHERE region IS NOT NULL) AS regions,
      ARRAY_AGG(DISTINCT state_name ORDER BY state_name)                            AS states,
      MIN(year)                                                                     AS year_min,
      MAX(year)                                                                     AS year_max
    FROM call_quality_reports;
  `;
  const { rows } = await pool.query(sql);
  return rows[0];
}, 3600)); // options change rarely -- cache an hour

module.exports = router;
