const express = require('express');
const router = express.Router();
const { withCache } = require('../middleware/cache');
const pool = require('../config/db');
const { STATES, UNION_TERRITORIES } = require('../config/stateCatalog');

router.get('/options', withCache(async () => {
  const sql = `
    SELECT
      ARRAY_AGG(DISTINCT region ORDER BY region) FILTER (WHERE region IS NOT NULL) AS regions,
      MIN(year) AS year_min,
      MAX(year) AS year_max,
      COUNT(*) AS total_records
    FROM call_quality_reports;
  `;
  const { rows } = await pool.query(sql);
  return {
    regions: rows[0].regions ?? [],
    states: STATES,
    union_territories: UNION_TERRITORIES,
    areas: [
      ...STATES.map((name) => ({ name, type: 'state' })),
      ...UNION_TERRITORIES.map((name) => ({ name, type: 'union_territory' })),
    ],
    year_min: Number(rows[0].year_min),
    year_max: Number(rows[0].year_max),
    total_records: rows[0].total_records,
  };
}, 3600));

module.exports = router;
