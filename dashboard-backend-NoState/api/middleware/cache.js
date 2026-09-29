// middleware/cache.js
// Cache-aside pattern: build a key from the route path + query params,
// serve from Redis if present, otherwise call the handler and cache its
// JSON response. If Redis is unreachable we fail OPEN (query Postgres
// directly) rather than fail the request -- staleness/slowness is a much
// smaller problem for a dashboard than an outage.

const redis = require('../config/redis');

const DEFAULT_TTL = parseInt(process.env.CACHE_TTL_SECONDS || '300', 10);

function buildKey(req) {
  const sortedQuery = Object.keys(req.query)
    .sort()
    .map((k) => `${k}=${req.query[k]}`)
    .join('&');
  return `cache:${req.baseUrl}${req.path}?${sortedQuery}`;
}

/**
 * Wrap an async route handler `fn(req, res)` that normally does
 * `res.json(data)`. This middleware intercepts that, caches the payload,
 * and replays it on subsequent hits.
 *
 * Usage:
 *   router.get('/kpis', withCache(async (req) => {
 *     const data = await getKpis(req.query);
 *     return data;
 *   }));
 */
function withCache(handlerReturningData, ttlSeconds = DEFAULT_TTL) {
  return async (req, res, next) => {
    const key = buildKey(req);

    try {
      const cached = await redis.get(key);
      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }
    } catch (err) {
      console.error('Redis GET failed, falling through to DB:', err.message);
    }

    try {
      const data = await handlerReturningData(req, res);
      if (res.headersSent) return; // handler already responded (e.g. validation error)

      res.set('X-Cache', 'MISS');
      res.json(data);

      redis.set(key, JSON.stringify(data), 'EX', ttlSeconds).catch((err) => {
        console.error('Redis SET failed (non-fatal):', err.message);
      });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { withCache };
