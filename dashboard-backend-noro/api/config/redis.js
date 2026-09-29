// config/redis.js
require('dotenv').config();
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: 2,
  retryStrategy: (times) => Math.min(times * 200, 2000),
  lazyConnect: false,
});

redis.on('error', (err) => {
  // If Redis is down, we log and let the cache middleware fall through to
  // a live DB query rather than take the whole API down with it.
  console.error('Redis connection error:', err.message);
});

module.exports = redis;
