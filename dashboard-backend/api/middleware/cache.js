// middleware/cache.js
// Cache-aside pattern: build a key from the route path + query params,
// serve from Redis if present, otherwise call the handler and cache its
// JSON response. If Redis is unreachable we fail OPEN (query Postgres
// directly) rather than fail the request -- staleness/slowness is a much
// smaller problem for a dashboard than an outage.

const redisClient = require('../utils/redisClient');
const logger = require('../utils/logger');

const DEFAULT_TTL = parseInt(process.env.CACHE_TTL_SECONDS || '3600', 10);

function makeCacheKey(baseUrl, path, query = {}) {
  const sortedQuery = Object.keys(query)
    .sort()
    .filter((k) => query[k] !== undefined && query[k] !== '')
    .map((k) => `${k}=${query[k]}`)
    .join('&');
  return `cache:${baseUrl}${path}?${sortedQuery}`;
}

function buildKey(req) {
  return makeCacheKey(req.baseUrl, req.path, req.query);
}

/**
 * Wrap an async route handler `fn(req, res)` that normally does
 * `res.json(data)`. This middleware intercepts that, caches the payload,
 * and replays it on subsequent hits.
 */
function withCache(handlerReturningData, ttlSeconds = DEFAULT_TTL) {
  return async (req, res, next) => {
    const key = buildKey(req);

    if (redisClient.isOpen) {
      try {
        const cached = await redisClient.get(key);
        if (cached) {
          res.set('X-Cache', 'HIT');
          return res.json(JSON.parse(cached));
        }
      } catch (err) {
        logger.warn({ key, err: err.message }, 'Redis GET failed, falling through to DB');
      }
    }

    try {
      const data = await handlerReturningData(req, res);
      if (res.headersSent) return; // handler already responded (e.g. validation error)

      res.set('X-Cache', 'MISS');
      res.json(data);

      if (redisClient.isOpen && data !== undefined) {
        redisClient.setEx(key, ttlSeconds, JSON.stringify(data)).catch((err) => {
          logger.warn({ key, err: err.message }, 'Redis SET failed (non-fatal)');
        });
      }
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { withCache, buildKey, makeCacheKey };
