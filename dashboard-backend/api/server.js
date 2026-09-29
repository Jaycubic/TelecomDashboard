// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const pool = require('./config/db');
const kpisRouter = require('./routes/kpis');
const stateQualityRouter = require('./routes/stateQuality');
const radarRouter = require('./routes/radar');
const indoorOutdoorRouter = require('./routes/indoorOutdoor');
const filtersRouter = require('./routes/filters');

const app = express();
const PORT = parseInt(process.env.PORT || '8094', 10);

const corsOriginEnv = process.env.CORS_ORIGIN || '*';
// A literal '*' must be passed to `cors()` as the string '*', not as a
// one-element array ['*'] -- the cors package treats an array as an
// allow-list to match the request's Origin header against verbatim, so
// ['*'] would never match a real origin like http://192.168.8.10:5173
// and Access-Control-Allow-Origin would silently never be sent. Confirmed
// by testing an actual cross-origin fetch against this server.
const corsOrigins = corsOriginEnv === '*' ? '*' : corsOriginEnv.split(',').map((s) => s.trim());
app.use(cors({ origin: corsOrigins }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'degraded', db: 'unreachable', error: err.message });
  }
});

app.use('/api/kpis', kpisRouter);
app.use('/api/state-quality', stateQualityRouter);
app.use('/api/radar', radarRouter);
app.use('/api/indoor-outdoor', indoorOutdoorRouter);
app.use('/api/filters', filtersRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
});

// Central error handler -- keeps stack traces out of API responses
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.message && err.message.startsWith('Invalid') ? 400 : 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Call quality dashboard API listening on http://0.0.0.0:${PORT}`);
});

module.exports = app;
