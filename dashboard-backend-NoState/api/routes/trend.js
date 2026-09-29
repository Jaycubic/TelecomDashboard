const express = require('express');
const router = express.Router();
const { withCache } = require('../middleware/cache');
const { getTrend } = require('../services/queries');

router.get('/', withCache(async (req) => getTrend(req.query), 900));

module.exports = router;
