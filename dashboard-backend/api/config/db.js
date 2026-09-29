// config/db.js
// PostgreSQL connection for the dashboard API.
//
// Important: load the API's .env from a path relative to this file rather
// than relying on process.cwd(). This prevents DB credentials from becoming
// undefined when the server is started from another directory (for example
// through PM2, a system service, or `node path/to/server.js`).
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '..', '.env'),
});

const { Pool } = require('pg');

const envString = (primary, fallback, defaultValue = '') => {
  const value = process.env[primary] ?? process.env[fallback] ?? defaultValue;
  return typeof value === 'string' ? value : String(value);
};

const schema = envString('DBPB_SCHEMA', 'DBP_SCHEMA', 'public');
const database = envString('DBPB_NAME', 'DBP_NAME', 'dashboard');
const user = envString('DBPB_USER', 'DBP_USER', 'jofrey');
const password = envString('DBPB_PASSWORD', 'DBP_PASSWORD', '');
const host = envString('DBPB_HOST', 'DBP_HOST', 'localhost');
const portValue = envString('DBPB_PORT', 'DBP_PORT', '5432');
const port = Number.parseInt(portValue, 10);

const pool = new Pool({
  database,
  user,
  // pg's SCRAM authentication requires a string password. Explicitly
  // normalizing it here prevents `client password must be a string` when an
  // environment/config value is injected as a non-string.
  password,
  host,
  port: Number.isFinite(port) ? port : 5432,
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
