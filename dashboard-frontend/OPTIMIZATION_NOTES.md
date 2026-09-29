# Rendering and Interaction Optimization

This revision focuses on interaction latency and visual stability without changing the information architecture.

- The India state/UT map is loaded from the bundled ~105 KB TopoJSON snapshot instead of fetching a ~41 MB server-generated GeoJSON response on every session.
- Filter responses use a short-lived in-memory cache and in-flight request coalescing. Re-selecting a location already visited in the session can render from memory immediately.
- Stale filter requests are aborted/ignored so a slower previous state cannot overwrite a newer selection.
- State point data is requested once per state/year selection for both operators, then filtered locally when Airtel/Jio visibility changes.
- State map loading shows a non-blocking skeleton overlay and a short transition when the geographic focus changes.
- Info popovers render in a portal so they are not clipped by chart-card overflow.
- Trend and setting charts use more of their available vertical space.
- Redis remains the server-side response cache. A lightweight WebSocket invalidation channel lets the browser clear its memory cache when the backend refresh job publishes new data.
- Redis prewarming no longer runs expensive spatial point queries for every state every refresh cycle. State summaries are optional; spatial data is cached on demand.
- The frontend does not use React Virtuoso for the location picker because the canonical state/UT list is only a few dozen items; a contained searchable list is lighter than virtualization for this dataset.
