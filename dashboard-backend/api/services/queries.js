// services/queries.js
// Central SQL definitions for the dashboard. Calculations are kept here so
// the UI can explain exactly what each number means without inventing metrics.

const pool = require('../config/db');
const { aliasesFor } = require('../config/stateCatalog');

const VALID_OPERATORS = new Set(['Airtel', 'Jio']);
const VALID_REGIONS = new Set(['North', 'West', 'East', 'South']);
const VALID_INOUT = new Set(['Indoor', 'Outdoor', 'Travelling']);

function buildWhereClause(filters = {}) {
  const clauses = [];
  const params = [];
  let i = 1;

  const { operator, region, state, year_start, year_end, inout } = filters;

  if (operator) {
    if (!VALID_OPERATORS.has(operator)) throw new Error(`Invalid operator: ${operator}`);
    clauses.push(`operator = $${i++}`);
    params.push(operator);
  }
  if (region) {
    if (!VALID_REGIONS.has(region)) throw new Error(`Invalid region: ${region}`);
    clauses.push(`region = $${i++}`);
    params.push(region);
  }
  if (state) {
    const aliases = aliasesFor(state);
    const placeholders = aliases.map(() => `$${i++}`);
    clauses.push(`state_name IN (${placeholders.join(', ')})`);
    params.push(...aliases);
  }
  if (inout) {
    if (!VALID_INOUT.has(inout)) throw new Error(`Invalid inout: ${inout}`);
    clauses.push(`inout = $${i++}`);
    params.push(inout);
  }
  if (year_start !== undefined && year_start !== '') {
    const year = parseInt(year_start, 10);
    if (!Number.isFinite(year)) throw new Error(`Invalid year_start: ${year_start}`);
    clauses.push(`year >= $${i++}`);
    params.push(year);
  }
  if (year_end !== undefined && year_end !== '') {
    const year = parseInt(year_end, 10);
    if (!Number.isFinite(year)) throw new Error(`Invalid year_end: ${year_end}`);
    clauses.push(`year <= $${i++}`);
    params.push(year);
  }

  return {
    whereSql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}

async function getKpis(filters) {
  const { whereSql, params } = buildWhereClause(filters);
  const sql = `
    SELECT
      operator,
      COUNT(*) AS total_reports,
      ROUND(AVG(rating)::numeric, 2) AS avg_rating,
      ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Call Dropped')
            / NULLIF(COUNT(*), 0), 2) AS call_drop_pct,
      ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Poor Voice Quality')
            / NULLIF(COUNT(*), 0), 2) AS poor_voice_pct
    FROM call_quality_reports
    ${whereSql}
    GROUP BY operator
    ORDER BY CASE WHEN operator = 'Airtel' THEN 1 ELSE 2 END;
  `;
  const { rows } = await pool.query(sql, params);
  return { filters, kpis: rows };
}

async function getStateQuality(filters) {
  const hasScopedFilter = Boolean(
    filters.operator || filters.region || filters.state || filters.inout ||
    filters.year_start !== undefined || filters.year_end !== undefined,
  );

  if (!hasScopedFilter) {
    const sql = `
      SELECT state_name, region, operator, total_reports, avg_rating,
             call_drop_pct, poor_voice_pct, satisfactory_pct,
             indoor_satisfactory_pct, outdoor_satisfactory_pct
      FROM mv_state_operator_summary
      ORDER BY state_name, CASE WHEN operator = 'Airtel' THEN 1 ELSE 2 END;
    `;
    const { rows } = await pool.query(sql);
    return { filters, source: 'materialized_view', states: rows };
  }

  const { whereSql, params } = buildWhereClause(filters);
  const sql = `
    SELECT
      state_name,
      region,
      operator,
      COUNT(*) AS total_reports,
      ROUND(AVG(rating)::numeric, 2) AS avg_rating,
      ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Call Dropped')
            / NULLIF(COUNT(*), 0), 2) AS call_drop_pct,
      ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Poor Voice Quality')
            / NULLIF(COUNT(*), 0), 2) AS poor_voice_pct,
      ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Satisfactory')
            / NULLIF(COUNT(*), 0), 2) AS satisfactory_pct,
      ROUND(100.0 * COUNT(*) FILTER (WHERE inout = 'Indoor' AND calldrop_category = 'Satisfactory')
            / NULLIF(COUNT(*) FILTER (WHERE inout = 'Indoor'), 0), 2) AS indoor_satisfactory_pct,
      ROUND(100.0 * COUNT(*) FILTER (WHERE inout = 'Outdoor' AND calldrop_category = 'Satisfactory')
            / NULLIF(COUNT(*) FILTER (WHERE inout = 'Outdoor'), 0), 2) AS outdoor_satisfactory_pct
    FROM call_quality_reports
    ${whereSql}
    GROUP BY state_name, region, operator
    ORDER BY state_name, CASE WHEN operator = 'Airtel' THEN 1 ELSE 2 END;
  `;
  const { rows } = await pool.query(sql, params);
  return { filters, source: 'live_aggregate', states: rows };
}

async function getRadarProfile(operator, filters = {}) {
  if (!VALID_OPERATORS.has(operator)) throw new Error(`Invalid operator: ${operator}`);
  const scopedFilters = { ...filters, operator };
  const { whereSql, params } = buildWhereClause(scopedFilters);
  const sql = `
    SELECT
      ROUND(AVG(rating)::numeric, 2) AS avg_rating,
      ROUND(100.0 * COUNT(*) FILTER (WHERE inout = 'Indoor' AND calldrop_category = 'Satisfactory')
            / NULLIF(COUNT(*) FILTER (WHERE inout = 'Indoor'), 0), 2) AS indoor_quality_pct,
      ROUND(100.0 * COUNT(*) FILTER (WHERE inout = 'Outdoor' AND calldrop_category = 'Satisfactory')
            / NULLIF(COUNT(*) FILTER (WHERE inout = 'Outdoor'), 0), 2) AS outdoor_quality_pct,
      ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Call Dropped')
            / NULLIF(COUNT(*), 0), 2) AS call_drop_pct,
      ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Poor Voice Quality')
            / NULLIF(COUNT(*), 0), 2) AS poor_voice_pct,
      COUNT(DISTINCT state_name) AS states_covered,
      COUNT(*) AS total_reports
    FROM call_quality_reports
    ${whereSql};
  `;
  const totalStatesSql = `SELECT COUNT(DISTINCT state_name) AS total_states FROM call_quality_reports;`;
  const [{ rows: metricRows }, { rows: totalRows }] = await Promise.all([
    pool.query(sql, params),
    pool.query(totalStatesSql),
  ]);

  const m = metricRows[0];
  const totalStates = parseInt(totalRows[0].total_states, 10) || 1;
  const statesCovered = parseInt(m.states_covered, 10) || 0;

  return {
    operator,
    filters,
    sample_size: parseInt(m.total_reports, 10) || 0,
    axes: {
      rating: m.avg_rating !== null ? Number(m.avg_rating) : null,
      indoor_quality: m.indoor_quality_pct !== null ? Number(m.indoor_quality_pct) : null,
      outdoor_quality: m.outdoor_quality_pct !== null ? Number(m.outdoor_quality_pct) : null,
      network_stability: m.call_drop_pct !== null ? Math.round((100 - Number(m.call_drop_pct)) * 10) / 10 : null,
      voice_clarity: m.poor_voice_pct !== null ? Math.round((100 - Number(m.poor_voice_pct)) * 10) / 10 : null,
      coverage: Math.round((statesCovered / totalStates) * 1000) / 10,
    },
  };
}

async function getIndoorOutdoor(filters) {
  const { whereSql, params } = buildWhereClause(filters);
  const settingClause = 'inout IN (\'Indoor\', \'Outdoor\')';
  const scopedWhere = whereSql ? `${whereSql} AND ${settingClause}` : `WHERE ${settingClause}`;
  const sql = `
    SELECT
      operator, inout, COUNT(*) AS total_reports,
      ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Call Dropped')
            / NULLIF(COUNT(*), 0), 2) AS call_drop_pct,
      ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Poor Voice Quality')
            / NULLIF(COUNT(*), 0), 2) AS poor_voice_pct,
      ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Satisfactory')
            / NULLIF(COUNT(*), 0), 2) AS satisfactory_pct
    FROM call_quality_reports
    ${scopedWhere}
    GROUP BY operator, inout
    ORDER BY CASE WHEN operator = 'Airtel' THEN 1 ELSE 2 END, inout;
  `;
  const { rows } = await pool.query(sql, params);
  return { filters, breakdown: rows };
}

async function getTrend(filters = {}) {
  const { whereSql, params } = buildWhereClause(filters);
  const start = filters.year_start == null || filters.year_start === '' ? null : parseInt(filters.year_start, 10);
  const end = filters.year_end == null || filters.year_end === '' ? null : parseInt(filters.year_end, 10);
  const monthly = start !== null && end !== null && start === end;

  const sql = monthly ? `
    SELECT
      operator,
      year,
      month,
      ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Satisfactory')
            / NULLIF(COUNT(*), 0), 2) AS satisfactory_pct,
      COUNT(*) AS total_reviews
    FROM call_quality_reports
    ${whereSql}
    GROUP BY operator, year, month
    ORDER BY year, month, CASE WHEN operator = 'Airtel' THEN 1 ELSE 2 END;
  ` : `
    SELECT
      operator,
      year,
      NULL::smallint AS month,
      ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Satisfactory')
            / NULLIF(COUNT(*), 0), 2) AS satisfactory_pct,
      COUNT(*) AS total_reviews
    FROM call_quality_reports
    ${whereSql}
    GROUP BY operator, year
    ORDER BY year, CASE WHEN operator = 'Airtel' THEN 1 ELSE 2 END;
  `;

  const { rows } = await pool.query(sql, params);
  return {
    filters,
    granularity: monthly ? 'month' : 'year',
    points: rows,
  };
}

async function getSpatialCells(filters = {}) {
  if (!filters.state) {
    return { filters, granularity: 'state', cells: [] };
  }

  const { whereSql, params } = buildWhereClause(filters);
  const scopedWhere = `${whereSql ? `${whereSql} AND` : 'WHERE'} latitude IS NOT NULL AND longitude IS NOT NULL`;

  // Aggregate the raw GPS observations into ~0.1-degree cells (~10–12 km).
  // This keeps the frontend smooth while still showing geographic variation
  // without introducing a district-level interpretation.
  const sql = `
    SELECT
      operator,
      ROUND((latitude::numeric / 0.1), 0) * 0.1 AS lat,
      ROUND((longitude::numeric / 0.1), 0) * 0.1 AS lon,
      COUNT(*) AS total_reviews,
      ROUND(AVG(rating)::numeric, 2) AS avg_rating,
      ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Satisfactory')
            / NULLIF(COUNT(*), 0), 2) AS satisfactory_pct,
      ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Call Dropped')
            / NULLIF(COUNT(*), 0), 2) AS call_drop_pct,
      ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Poor Voice Quality')
            / NULLIF(COUNT(*), 0), 2) AS poor_voice_pct
    FROM call_quality_reports
    ${scopedWhere}
    GROUP BY operator, lat, lon
    ORDER BY total_reviews DESC;
  `;

  const { rows } = await pool.query(sql, params);
  return {
    filters,
    granularity: 'cell_0.1_degree',
    cells: rows,
  };
}

async function getSampleConfidence(filters = {}) {
  const { whereSql, params } = buildWhereClause(filters);
  const sql = `
    SELECT
      state_name,
      operator,
      COUNT(*) AS total_reports,
      CASE
        WHEN COUNT(*) < 30 THEN 'low'
        WHEN COUNT(*) < 100 THEN 'medium'
        ELSE 'high'
      END AS confidence
    FROM call_quality_reports
    ${whereSql}
    GROUP BY state_name, operator
    ORDER BY state_name, CASE WHEN operator = 'Airtel' THEN 1 ELSE 2 END;
  `;
  const { rows } = await pool.query(sql, params);
  return { filters, confidence: rows };
}

module.exports = {
  buildWhereClause,
  getKpis,
  getStateQuality,
  getRadarProfile,
  getIndoorOutdoor,
  getTrend,
  getSpatialCells,
  getSampleConfidence,
};
