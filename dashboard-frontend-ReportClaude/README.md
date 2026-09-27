# Airtel vs Jio Call Quality Dashboard — Frontend

React + TypeScript + Vite, wired to the `dashboard-backend` API. Built and
tested for real: `npm run build` and a full type-check both actually pass,
and `scripts/verify-map-data.ts` executes the map-coloring and state-name
logic against synthetic data (not just checks that it compiles) --
including a direct cross-check that this project's state-name
canonicalization produces byte-identical output to the backend's
`canonicalize_state_name()`, since a mismatch there would silently break
the map join. I also ran the real API (real Postgres + Redis, small real
dataset) and hit every endpoint from a Node `fetch()` with a cross-origin
`Origin` header, the same way the browser will -- that's how a real CORS
bug (see below) got caught before you did.

## What's real vs what to double-check

**Actually tested:**
- TypeScript compiles clean (`npm run typecheck`, `npm run build`)
- Map data pipeline: 16MB DataMeet GeoJSON → 105KB TopoJSON, all 36
  states/UTs survive simplification, rendered and visually inspected
- State-name canonicalization matches the backend exactly (both sides
  turn "NCT" and "Delhi" into "NCT of Delhi", etc.) -- verified by
  running the same test cases through both and diffing the output
- Every API call the frontend makes, against a live backend, with a real
  cross-origin `Origin` header (not same-origin `localhost`, since your
  LAN setup won't be same-origin either)
- Found and fixed a real CORS bug in the backend while testing this
  (`origin: ['*']` doesn't mean what it looks like it means to the `cors`
  package -- see `api/server.js`)

**Not tested (couldn't be, from this sandbox) -- verify these yourself:**
- Actual visual rendering in a browser. Everything above proves the code
  runs and the data flowing through it is correct, not that the map looks
  right at 1920px vs on your phone, or that no CSS rule collides with
  another. Open it and look.
- Performance against your real ~800k/900k-row dataset. All testing here
  used 2-4 row fixtures; the map/KPI queries should hold up fine (they're
  aggregate SQL, not per-row rendering) but confirm the API response
  times are acceptable before you build a demo around it.
- Any spelling variant in your full dataset that isn't in
  `src/lib/stateNameMap.ts` / `ingestion/STATE_NAME_CANON` yet. I mapped
  every variant visible in the ~100-row sheet previews I could see, not
  your full files.

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL to your API, e.g. http://192.168.8.10:8094
npm run dev             # http://localhost:5173
```

Run the backend (see `dashboard-backend/README.md`) first, or the app
will load with an "Updating…" / error state and empty panels -- that's
the error path in `useDashboardState.ts` working as intended, not a bug.

```bash
npm run build            # production build -> dist/
npm run typecheck        # tsc only, no build
npm run verify-map-data  # re-run the map/state-name logic checks
```

## Layout

```
src/
├── types.ts                    # mirrors the backend's JSON response shapes
├── lib/
│   ├── api.ts                   # typed fetch wrapper, one function per endpoint
│   ├── constants.ts             # colorblind-safe Airtel/Jio palette, regions
│   ├── format.ts                 # number/percent formatting (Postgres sends numerics as strings)
│   ├── geo.ts                    # TopoJSON -> GeoJSON, projection/path builder
│   ├── mapColor.ts               # state fill/opacity/confidence logic (unit-tested, see scripts/)
│   └── stateNameMap.ts           # dataset state_name -> GeoJSON ST_NM (mirrors backend)
├── data/india-states-topo.json  # simplified DataMeet boundaries, 105KB
├── hooks/useDashboardState.ts   # owns filters + orchestrates all fetches
├── components/
│   ├── Header, Sidebar (filters), Kpi (KPI strip)
│   ├── Map (the India choropleth -- the hero element)
│   ├── Radar (Airtel vs Jio 6-axis profile)
│   ├── Bars (indoor vs outdoor)
│   └── Panel (the three assignment-required panels)
└── App.tsx                       # composes everything
scripts/verify-map-data.ts        # standalone data/logic regression check
```

## Design decisions worth knowing about before you present this

- **One radar chart, not two.** The sketch had duplicate near-identical
  spider charts; I dropped that redundancy -- Airtel and Jio overlay on a
  single chart, Jio's line is dashed as a second cue beyond color.
- **Map color encodes margin, not just winner.** A state where Airtel
  barely edges out Jio is a pale red; a landslide is a deep red. This
  is a judgment call, not ground truth -- the exact "composite quality
  score" formula is in `mapColor.ts`'s `qualityScore()`, adjust it if you
  want a different definition of "better."
- **Low-confidence states get a hatch pattern, not a different hue.**
  Changing color for uncertainty would compete with the operator-lead
  color coding; a pattern overlay stays legible on top of either color
  and survives grayscale/colorblind rendering.
- **The map's one animation is a single load-in, not hover effects
  everywhere.** Intentional restraint for an analyst-facing tool.

## Known follow-ups

- The radar's "Coverage" axis is `states_covered / total_states_in_dataset`
  -- it doesn't weight by report volume, so an operator with 1 report in
  20 states scores the same "coverage" as one with 10,000 reports in
  those states. Decide if that's the metric you actually want for the
  case study.
- No loading skeleton -- panels just show stale/empty data during
  `loading: true`. Fine for a LAN demo, worth a pass if this goes further.
