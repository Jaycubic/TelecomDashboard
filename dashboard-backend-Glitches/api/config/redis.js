// config/redis.js
// Re-exports singleton redisClient from utils/redisClient
const redisClient = require('../utils/redisClient');

module.exports = redisClient;
