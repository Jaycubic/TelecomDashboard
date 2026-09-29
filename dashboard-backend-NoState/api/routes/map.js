const express = require('express');
const router = express.Router();
const { MAP_SOURCE_URL } = require('../config/mapSource');

let cache = null;
let fetchedAt = 0;
const CACHE_MS = 24 * 60 * 60 * 1000;

router.get('/india', async (req, res, next) => {
  try {
    const now = Date.now();
    if (cache && now - fetchedAt < CACHE_MS) {
      res.json(cache);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let upstream;
    try {
      upstream = await fetch(MAP_SOURCE_URL, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    if (!upstream.ok) {
      throw new Error(`Map source returned HTTP ${upstream.status}`);
    }

    const topology = await upstream.json();
    cache = {
      source: 'India Maps Data / udit-001, pinned TopoJSON snapshot',
      licence: 'See source repository for map-data provenance and licence.',
      topology,
    };
    fetchedAt = now;
    res.json(cache);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
