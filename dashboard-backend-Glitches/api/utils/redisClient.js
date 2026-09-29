// server/utils/redisClient.js
const redis = require('redis');
const logger = require('./logger');
require('dotenv').config();

const REDIS_URL = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`;
const MAX_MEMORY = process.env.REDIS_MAX_MEMORY || '100mb';

// Create a single client instance
const redisClient = redis.createClient({
  url: REDIS_URL,
  password: process.env.REDIS_PASSWORD || undefined,
  socket: {
    // Never permanently close the client.
    // Retry with exponential backoff capped at 5 s.
    // Returning an Error would mark the client as closed forever — avoid that.
    reconnectStrategy: (retries) => {
      const delay = Math.min(retries * 200, 5000);
      if (retries % 5 === 0) {
        logger.warn({ retries, delay }, 'Redis reconnecting...');
      }
      return delay;
    },
  },
});

let isConnected = false;

redisClient.on('error', (err) => {
  logger.error(err, 'Redis Client Error');
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
  isConnected = true;
});

redisClient.on('ready', async () => {
  logger.info('Redis Client Ready');
  // Configure 100MB maximum memory limit & LRU eviction policy
  try {
    await redisClient.configSet('maxmemory', MAX_MEMORY);
    await redisClient.configSet('maxmemory-policy', 'allkeys-lru');
    logger.info(`Redis maxmemory configured to ${MAX_MEMORY} with 'allkeys-lru' eviction policy`);
  } catch (err) {
    logger.warn({ warning: err.message }, 'Could not set Redis maxmemory via CONFIG (may be disabled on cloud/managed instances)');
  }
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis Client Reconnecting');
});

// 'end' fires when the client is cleanly closed (e.g. quit/disconnect called).
// Re-open automatically so cron jobs never hit a permanently-dead client.
redisClient.on('end', () => {
  logger.warn('Redis Client connection ended — reconnecting...');
  isConnected = false;
  setTimeout(async () => {
    try {
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
    } catch (err) {
      logger.error(err, 'Redis Client failed to reconnect after end event');
    }
  }, 1000);
});

// Polyfill/wrap set for legacy signature compatibility: client.set(key, val, 'EX', seconds)
const originalSet = redisClient.set.bind(redisClient);
redisClient.set = async function (key, value, ...args) {
  if (args[0] === 'EX' && typeof args[1] === 'number') {
    return originalSet(key, value, { EX: args[1] });
  }
  return originalSet(key, value, ...args);
};

// Safe JSON helper methods
redisClient.getJson = async function (key) {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error(err, `Failed to parse cached JSON for key: ${key}`);
    return null;
  }
};

redisClient.setJson = async function (key, data, ttlSeconds = 3600) {
  try {
    const payload = JSON.stringify(data);
    await redisClient.setEx(key, ttlSeconds, payload);
    return true;
  } catch (err) {
    logger.error(err, `Failed to set cached JSON for key: ${key}`);
    return false;
  }
};

// Scan and clean keys matching a pattern without blocking Redis
redisClient.cleanPattern = async function (pattern = 'cache:*') {
  if (!redisClient.isOpen) return 0;
  let cursor = 0;
  let deletedCount = 0;
  try {
    do {
      const reply = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = reply.cursor;
      const keys = reply.keys;
      if (keys && keys.length > 0) {
        await redisClient.del(keys);
        deletedCount += keys.length;
      }
    } while (cursor !== 0);
    logger.info({ pattern, deletedCount }, 'Cleaned matching Redis cache keys');
    return deletedCount;
  } catch (err) {
    logger.error(err, `Error cleaning cache pattern: ${pattern}`);
    return deletedCount;
  }
};

// Initial connect
(async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    logger.error(err, 'Failed to connect to Redis on startup');
  }
})();

module.exports = redisClient;
