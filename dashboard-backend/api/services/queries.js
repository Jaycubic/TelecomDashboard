// services/queries.js
// All raw SQL lives here so routes stay thin and the aggregation logic
// (i.e. "what does call-drop % / poor-voice % / avg rating actually mean")
// is defined in exactly one place.

const pool = require('../config/db');

const VALID_OPERATORS = new Set(['Airtel', 'Jio']);
const VALID_REGIONS = new Set(['North', 'West', 'East', 'South']);
const VALID_INOUT = new Set(['Indoor', 'Outdoor', 'Travelling']);

/**
 * Builds a parameterized WHERE clause from the dashboard's global filters.
 * Every filter is optional. Returns { whereSql, params }.
 *
 * Accepted query params: operator, region, state, year_start, year_end, inout
 */
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
    clauses.push(`state_name = $${i++}`);
    params.push(state);
  }
  if (inout) {
    if (!VALID_INOUT.has(inout)) throw new Error(`Invalid inout: ${inout}`);
    clauses.push(`inout = $${i++}`);
    params.push(inout);
  }
  if (year_start) {
    clauses.push(`year >= $${i++}`);
    params.push(parseInt(year_start, 10));
  }
  if (year_end) {
    clauses.push(`year <= $${i++}`);
    params.push(parseInt(year_end, 10));
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return { whereSql, params };
}

/**
 * KPI pills: feedback volume, call drop %, poor voice %, avg rating --
 * per operator, for whatever filters are active. Always returns both
 * operators side by side so the UI can render the "Airtel X / Jio Y" rows.
 */
async function getKpis(filters) {
  const { whereSql, params } = buildWhereClause(filters);

  const sql = `
    SELECT
      operator,
      COUNT(*)                                                                  AS total_reports,
      ROUND(AVG(rating)::numeric, 2)                                            AS avg_rating,
      ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Call Dropped')
            / NULLIF(COUNT(*), 0), 2)                                           AS call_drop_pct,
      ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Poor Voice Quality')
            / NULLIF(COUNT(*), 0), 2)                                           AS poor_voice_pct
    FROM call_quality_reports
    ${whereSql}
    GROUP BY operator
    ORDER BY operator;
  `;

  const { rows } = await pool.query(sql, params);
  return { filters, kpis: rows };
}

/**
 * State-level choropleth data. Prefers the pre-aggregated materialized
 * view (fast, but only reflects the FULL date range at last refresh).
 * Falls back to a live aggregate over the raw table when a year filter
 * is present, since the mv isn't year-partitioned.
 */
async function getStateQuality(filters) {
  const { region, year_start, year_end } = filters;
  const usingYearFilter = Boolean(year_start || year_end);

  if (!usingYearFilter) {
    const clauses = [];
    const params = [];
    let i = 1;
    if (region) {
      clauses.push(`region = $${i++}`);
      params.push(region);
    }
    const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const sql = `
      SELECT state_name, region, operator, total_reports, avg_rating,
             call_drop_pct, poor_voice_pct, satisfactory_pct,
             indoor_satisfactory_pct, outdoor_satisfactory_pct
      FROM mv_state_operator_summary
      ${whereSql}
      ORDER BY state_name, operator;
    `;
    const { rows } = await pool.query(sql, params);
    return { filters, source: 'materialized_view', states: rows };
  }

  const { whereSql, params } = buildWhereClause(filters);
  const sql = `
    SELECT
      state_name, region, operator,
      COUNT(*)                                                                  AS total_reports,
      ROUND(AVG(rating)::numeric, 2)                                            AS avg_rating,
      ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Call Dropped')
            / NULLIF(COUNT(*), 0), 2)                                           AS call_drop_pct,
      ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Poor Voice Quality')
            / NULLIF(COUNT(*), 0), 2)                                           AS poor_voice_pct
    FROM call_quality_reports
    ${whereSql}
    GROUP BY state_name, region, operator
    ORDER BY state_name, operator;
  `;
  const { rows } = await pool.query(sql, params);
  return { filters, source: 'live_aggregate', states: rows };
}

/**
 * Radar profile axes. These formulas are a design choice, not ground
 * truth -- adjust freely, but keep them documented since the case study
 * needs to justify what "Network Stability" etc. actually measure.
 *
 *   Rating              -> avg(rating), scaled 0-5 as-is
 *   Indoor Quality       -> % of indoor reports rated 'Satisfactory'
 *   Outdoor Quality       -> % of outdoor reports rated 'Satisfactory'
 *   Network Stability   -> 100 - call_drop_pct   (fewer drops = more stable)
 *   Voice Clarity        -> 100 - poor_voice_pct  (less distortion = clearer)
 *   Coverage             -> distinct states with >= 1 report, as % of all
 *                           states seen in the dataset for that operator's
 *                           filtered scope
 */
async function getRadarProfile(operator, filters = {}) {
  if (!VALID_OPERATORS.has(operator)) throw new Error(`Invalid operator: ${operator}`);

  const scopedFilters = { ...filters, operator };
  const { whereSql, params } = buildWhereClause(scopedFilters);

  const metricsSql = `
    SELECT
      ROUND(AVG(rating)::numeric, 2)                                                     AS avg_rating,
      ROUND(100.0 * COUNT(*) FILTER (WHERE inout = 'Indoor' AND calldrop_category = 'Satisfactory')
            / NULLIF(COUNT(*) FILTER (WHERE inout = 'Indoor'), 0), 2)                     AS indoor_quality_pct,
      ROUND(100.0 * COUNT(*) FILTER (WHERE inout = 'Outdoor' AND calldrop_category = 'Satisfactory')
            / NULLIF(COUNT(*) FILTER (WHERE inout = 'Outdoor'), 0), 2)                    AS outdoor_quality_pct,
      ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Call Dropped')
            / NULLIF(COUNT(*), 0), 2)                                                     AS call_drop_pct,
      ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Poor Voice Quality')
            / NULLIF(COUNT(*), 0), 2)                                                     AS poor_voice_pct,
      COUNT(DISTINCT state_name)                                                          AS states_covered,
      COUNT(*)                                                                            AS total_reports
    FROM call_quality_reports
    ${whereSql};
  `;

  const totalStatesSql = `
    SELECT COUNT(DISTINCT state_name) AS total_states FROM call_quality_reports;
  `;

  const [{ rows: metricRows }, { rows: totalRows }] = await Promise.all([
    pool.query(metricsSql, params),
    pool.query(totalStatesSql),
  ]);

  const m = metricRows[0];
  const totalStates = parseInt(totalRows[0].total_states, 10) || 1;
  const coveragePct = m.states_covered
    ? Math.round((parseInt(m.states_covered, 10) / totalStates) * 1000) / 10
    : 0;

  return {
    operator,
    filters,
    sample_size: parseInt(m.total_reports, 10),
    axes: {
      rating: m.avg_rating !== null ? Number(m.avg_rating) : null,
      indoor_quality: m.indoor_quality_pct !== null ? Number(m.indoor_quality_pct) : null,
      outdoor_quality: m.outdoor_quality_pct !== null ? Number(m.outdoor_quality_pct) : null,
      network_stability: m.call_drop_pct !== null ? Math.round((100 - Number(m.call_drop_pct)) * 10) / 10 : null,
      voice_clarity: m.poor_voice_pct !== null ? Math.round((100 - Number(m.poor_voice_pct)) * 10) / 10 : null,
      coverage: coveragePct,
    },
  };
}

/**
 * Indoor vs outdoor clustered bars: rates per inout bucket, per operator.
 */
async function getIndoorOutdoor(filters) {
  const { whereSql, params } = buildWhereClause(filters);

  const sql = `
    SELECT
      operator, inout,
      COUNT(*)                                                                  AS total_reports,
      ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Call Dropped')
            / NULLIF(COUNT(*), 0), 2)                                           AS call_drop_pct,
      ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Poor Voice Quality')
            / NULLIF(COUNT(*), 0), 2)                                           AS poor_voice_pct,
      ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Satisfactory')
            / NULLIF(COUNT(*), 0), 2)                                           AS satisfactory_pct
    FROM call_quality_reports
    ${whereSql}
    GROUP BY operator, inout
    ORDER BY operator, inout;
  `;
  const { rows } = await pool.query(sql, params);
  return { filters, breakdown: rows };
}

/**
 * Sample-size confidence per state/operator -- drives a "low sample, read
 * with caution" flag in the UI rather than letting a 3-report state look
 * as authoritative as a 3,000-report one.
 */
async function getSampleConfidence(filters) {
  const { region } = filters;
  const clauses = [];
  const params = [];
  let i = 1;
  if (region) {
    clauses.push(`region = $${i++}`);
    params.push(region);
  }
  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const sql = `
    SELECT state_name, operator, total_reports, confidence
    FROM v_sample_confidence
    ${whereSql}
    ORDER BY state_name, operator;
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
  getSampleConfidence,
};
