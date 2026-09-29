const express = require('express');
const router = express.Router();
const { withCache } = require('../middleware/cache');
const { getFilterOptionsData } = require('../services/queries');

router.get('/options', withCache(async () => {
  return getFilterOptionsData();
}, 3600));

module.exports = router;
