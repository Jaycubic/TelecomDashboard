# Backend Rendering and Cache Optimization

- The primary India geometry endpoint now serves the small bundled state/UT TopoJSON snapshot instead of converting and serializing the remote shapefile on request.
- Express response compression is enabled for JSON payloads.
- Redis cache-aside middleware now coalesces concurrent identical cache misses inside the API process.
- State spatial points are cached on demand rather than pre-warmed for every state; this avoids database/connection-pool contention during cache refresh.
- Periodic cache refresh defaults to every 30 minutes; optional state summary prewarming can be enabled with `PREWARM_STATE_SUMMARIES=true`.
- Successful cache refreshes publish a `dashboard:refresh` event on Redis. The WebSocket endpoint `/ws` forwards that event to connected dashboards.
- The existing PostgreSQL indexes remain the query path for state/year/operator/geo aggregation.
