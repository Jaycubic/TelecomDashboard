// config/db.js
// Plain `pg` Pool rather than an ORM: the dashboard's real workload is a
// handful of aggregate SQL queries over ~1.5M rows, and hand-written SQL
// (see services/queries.js) is both faster and easier to reason about
// than building the same aggregates through an ORM's query builder.
// If you'd rather keep everything in Sequelize for consistency with your
// other services, swap this file for the connection.js you already have
// and pass `sequelize.query(sql, { replacements })` instead of pool.query().

require('dotenv').config();
const { Pool } = require('pg');

const schema = process.env.DBPB_SCHEMA || process.env.DBP_SCHEMA || 'public';

const pool = new Pool({
  database: process.env.DBPB_NAME || process.env.DBP_NAME || 'dashboard',
  user: process.env.DBPB_USER || process.env.DBP_USER || 'jofrey',
  password: process.env.DBPB_PASSWORD || process.env.DBP_PASSWORD || '',
  host: process.env.DBPB_HOST || process.env.DBP_HOST || 'localhost',
  port: parseInt(process.env.DBPB_PORT || process.env.DBP_PORT || '5432', 10),
  options: `-c search_path=${schema}`,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  // Idle client errors (e.g. connection dropped) -- log, don't crash the server
  console.error('Unexpected PG pool error:', err.message);
});

module.exports = pool;
