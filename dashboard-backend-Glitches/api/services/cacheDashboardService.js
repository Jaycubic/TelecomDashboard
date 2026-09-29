// services/cacheDashboardService.js
// Pre-warms and periodically refreshes Redis cache for All-India and State-level queries.
// Ensures switching between All India and individual States has sub-millisecond response times.

const cron = require('node-cron');
const redisClient = require('../utils/redisClient'); // Use singleton
require('dotenv').config();
const logger = require('../utils/logger');
const { makeCacheKey } = require('../middleware/cache');
const {
  getKpis,
  getStateQuality,
  getSampleConfidence,
  getIndoorOutdoor,
  getTrend,
  getSpatialCells,
  getRadarProfile,
  getFilterOptionsData,
} = require('./queries');
const { STATES, UNION_TERRITORIES } = require('../config/stateCatalog');

let isRunning = false;
const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS || '3600', 10);

async function cacheArea(areaName, yearMin, yearMax) {
  const query = {
    state: areaName,
    year_start: String(yearMin),
    year_end: String(yearMax),
  };
  const filter = {
    state: areaName,
    year_start: yearMin,
    year_end: yearMax,
  };

  try {
    const [kpis, stateQuality, confidence, indoorOutdoor, trend, cellsBoth, cellsAirtel, cellsJio, radarAirtel, radarJio] = await Promise.all([
      getKpis(filter),
      getStateQuality(filter),
      getSampleConfidence(filter),
      getIndoorOutdoor(filter),
      getTrend(filter),
      getSpatialCells(filter),
      getSpatialCells({ ...filter, operator: 'Airtel' }),
      getSpatialCells({ ...filter, operator: 'Jio' }),
      getRadarProfile('Airtel', filter).catch(() => null),
      getRadarProfile('Jio', filter).catch(() => null),
    ]);

    const setOps = [
      redisClient.setEx(makeCacheKey('/api/kpis', '/', query), CACHE_TTL, JSON.stringify(kpis)),
      redisClient.setEx(makeCacheKey('/api/state-quality', '/', query), CACHE_TTL, JSON.stringify(stateQuality)),
      redisClient.setEx(makeCacheKey('/api/state-quality', '/confidence', query), CACHE_TTL, JSON.stringify(confidence)),
      redisClient.setEx(makeCacheKey('/api/indoor-outdoor', '/', query), CACHE_TTL, JSON.stringify(indoorOutdoor)),
      redisClient.setEx(makeCacheKey('/api/trend', '/', query), CACHE_TTL, JSON.stringify(trend)),
      redisClient.setEx(makeCacheKey('/api/map', '/state-points', query), CACHE_TTL, JSON.stringify(cellsBoth)),
      redisClient.setEx(makeCacheKey('/api/map', '/state-points', { ...query, operator: 'Airtel' }), CACHE_TTL, JSON.stringify(cellsAirtel)),
      redisClient.setEx(makeCacheKey('/api/map', '/state-points', { ...query, operator: 'Jio' }), CACHE_TTL, JSON.stringify(cellsJio)),
    ];

    if (radarAirtel) {
      setOps.push(redisClient.setEx(makeCacheKey('/api/radar', '/Airtel', query), CACHE_TTL, JSON.stringify(radarAirtel)));
    }
    if (radarJio) {
      setOps.push(redisClient.setEx(makeCacheKey('/api/radar', '/Jio', query), CACHE_TTL, JSON.stringify(radarJio)));
    }

    await Promise.all(setOps);
  } catch (err) {
    logger.error(err, `Failed to cache data for area: ${areaName}`);
  }
}

async function cacheNationalViews(yearMin, yearMax) {
  const query = {
    year_start: String(yearMin),
    year_end: String(yearMax),
  };
  const filter = {
    year_start: yearMin,
    year_end: yearMax,
  };

  try {
    const [kpis, stateQuality, confidence, indoorOutdoor, trend, radarAirtel, radarJio] = await Promise.all([
      getKpis(filter),
      getStateQuality(filter),
      getSampleConfidence(filter),
      getIndoorOutdoor(filter),
      getTrend(filter),
      getRadarProfile('Airtel', filter).catch(() => null),
      getRadarProfile('Jio', filter).catch(() => null),
    ]);

    const setOps = [
      // Scoped by default year range
      redisClient.setEx(makeCacheKey('/api/kpis', '/', query), CACHE_TTL, JSON.stringify(kpis)),
      redisClient.setEx(makeCacheKey('/api/state-quality', '/', query), CACHE_TTL, JSON.stringify(stateQuality)),
      redisClient.setEx(makeCacheKey('/api/state-quality', '/confidence', query), CACHE_TTL, JSON.stringify(confidence)),
      redisClient.setEx(makeCacheKey('/api/indoor-outdoor', '/', query), CACHE_TTL, JSON.stringify(indoorOutdoor)),
      redisClient.setEx(makeCacheKey('/api/trend', '/', query), CACHE_TTL, JSON.stringify(trend)),

      // Also cache unscoped (empty query) All-India
      redisClient.setEx(makeCacheKey('/api/kpis', '/', {}), CACHE_TTL, JSON.stringify(kpis)),
      redisClient.setEx(makeCacheKey('/api/state-quality', '/', {}), CACHE_TTL, JSON.stringify(stateQuality)),
      redisClient.setEx(makeCacheKey('/api/state-quality', '/confidence', {}), CACHE_TTL, JSON.stringify(confidence)),
      redisClient.setEx(makeCacheKey('/api/indoor-outdoor', '/', {}), CACHE_TTL, JSON.stringify(indoorOutdoor)),
      redisClient.setEx(makeCacheKey('/api/trend', '/', {}), CACHE_TTL, JSON.stringify(trend)),
    ];

    if (radarAirtel) {
      setOps.push(redisClient.setEx(makeCacheKey('/api/radar', '/Airtel', query), CACHE_TTL, JSON.stringify(radarAirtel)));
      setOps.push(redisClient.setEx(makeCacheKey('/api/radar', '/Airtel', {}), CACHE_TTL, JSON.stringify(radarAirtel)));
    }
    if (radarJio) {
      setOps.push(redisClient.setEx(makeCacheKey('/api/radar', '/Jio', query), CACHE_TTL, JSON.stringify(radarJio)));
      setOps.push(redisClient.setEx(makeCacheKey('/api/radar', '/Jio', {}), CACHE_TTL, JSON.stringify(radarJio)));
    }

    await Promise.all(setOps);
    logger.info('Cached All-India summary views in Redis');
  } catch (err) {
    logger.error(err, 'Failed to cache All-India summary views');
  }
}

async function cacheDashboardData() {
  if (isRunning) {
    logger.warn('Skipping cacheDashboard run: Previous caching job still active.');
    return;
  }
  if (!redisClient.isOpen) {
    logger.warn('Skipping cacheDashboard run: Redis client is not connected.');
    return;
  }

  isRunning = true;
  const startTime = Date.now();

  try {
    logger.info('Starting dashboard cache pre-warming for All India & States...');

    // 1. Cache filter options
    const filterOptions = await getFilterOptionsData();
    await redisClient.setEx(makeCacheKey('/api/filters', '/options', {}), CACHE_TTL, JSON.stringify(filterOptions));
    logger.info('Cached filter options');

    const yearMin = filterOptions.year_min || 2017;
    const yearMax = filterOptions.year_max || 2025;

    // 2. Cache All-India views
    await cacheNationalViews(yearMin, yearMax);

    // 3. Cache each State & Union Territory in batches
    const allAreas = [...STATES, ...UNION_TERRITORIES];
    const BATCH_SIZE = 4;
    for (let i = 0; i < allAreas.length; i += BATCH_SIZE) {
      const batch = allAreas.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map((area) => cacheArea(area, yearMin, yearMax)));
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info({ totalAreas: allAreas.length, durationSeconds: duration }, 'Successfully pre-warmed dashboard Redis cache');
  } catch (error) {
    logger.error(error, 'Error in cacheDashboardData:');
  } finally {
    isRunning = false;
  }
}

function startCronJob() {
  logger.info('Cron job started: Refreshing dashboard cache every 10 minutes.');

  // Run every 10 minutes to keep cache warm and refreshed
  cron.schedule('*/10 * * * *', cacheDashboardData);

  // Initial warming run on startup after a 2-second grace period
  setTimeout(() => {
    cacheDashboardData();
  }, 2000);
}

module.exports = {
  startCronJob,
  cacheDashboardData,
  cleanCache: () => redisClient.cleanPattern('cache:*'),
};
