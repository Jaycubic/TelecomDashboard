// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const pool = require('./config/db');
const redisClient = require('./utils/redisClient');
const { startCronJob, cleanCache } = require('./services/cacheDashboardService');
const logger = require('./utils/logger');

const kpisRouter = require('./routes/kpis');
const stateQualityRouter = require('./routes/stateQuality');
const radarRouter = require('./routes/radar');
const indoorOutdoorRouter = require('./routes/indoorOutdoor');
const filtersRouter = require('./routes/filters');
const trendRouter = require('./routes/trend');
const mapRouter = require('./routes/map');

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

// Health check endpoint reporting both PostgreSQL and Redis status
app.get('/health', async (req, res) => {
  let dbStatus = 'ok';
  let dbError = null;
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    dbStatus = 'unreachable';
    dbError = err.message;
  }

  const redisStatus = redisClient.isOpen ? 'connected' : 'disconnected';
  const isHealthy = dbStatus === 'ok';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy && redisStatus === 'connected' ? 'ok' : 'degraded',
    db: dbStatus,
    redis: redisStatus,
    ...(dbError ? { dbError } : {}),
  });
});

// Cache control endpoint for explicit cache invalidation/cleaning
app.post('/api/cache/clean', async (req, res) => {
  try {
    const deletedCount = await cleanCache();
    res.json({ status: 'ok', message: 'Cache cleared successfully', deletedCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear cache', details: err.message });
  }
});

app.use('/api/kpis', kpisRouter);
app.use('/api/state-quality', stateQualityRouter);
app.use('/api/radar', radarRouter);
app.use('/api/indoor-outdoor', indoorOutdoorRouter);
app.use('/api/filters', filtersRouter);
app.use('/api/trend', trendRouter);
app.use('/api/map', mapRouter);

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

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Call quality dashboard API listening on http://0.0.0.0:${PORT}`);
  // Start Redis pre-warming and recurring cron refresh service
  startCronJob();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server and Redis connection...');
  server.close(async () => {
    try {
      if (redisClient.isOpen) await redisClient.quit();
      await pool.end();
    } catch (e) {
      // Ignore during exit
    }
    process.exit(0);
  });
});

module.exports = app;
