# Airtel vs Jio Call Quality Dashboard -- Backend

Code only, as requested. Everything below was actually run and verified
against a real local PostgreSQL + Redis before being handed to you (not
just syntax-checked) -- one real bug (NaN loading as the literal string
"NaN" in nullable columns) was caught and fixed this way. You still need
to test it against your real ~1.6M-row dataset and your LAN setup
yourself; I can't reach 192.168.8.10 from here.

## Layout

```
dashboard-backend/
├── state_region_map.json     # single source of truth: state -> North/West/East/South
├── db/
│   └── schema.sql             # table, indexes, materialized view, confidence view
├── ingestion/
│   ├── ingest.py               # CSV -> Postgres loader
│   └── requirements.txt
└── api/
    ├── server.js               # Express entrypoint
    ├── config/db.js            # pg Pool
    ├── config/redis.js         # ioredis client
    ├── middleware/cache.js     # cache-aside wrapper, fails open if Redis is down
    ├── services/queries.js     # all SQL lives here
    ├── routes/                 # kpis, stateQuality, radar, indoorOutdoor, filters
    └── package.json
```

## 1. Database

```bash
createdb academicplanning
psql -d academicplanning -f db/schema.sql
```

## 2. Ingest your data

Export each sheet (or your full 800k/900k-row files) to CSV first, then:

```bash
cd ingestion
pip install -r requirements.txt --break-system-packages
export DBPB_NAME=dashboard DBPB_USER= DBPB_PASSWORD= DBPB_HOST=localhost DBPB_PORT= DBPB_SCHEMA=public

python3 ingest.py --csv path/to/airtel_indoor.csv --operator Airtel
python3 ingest.py --csv path/to/airtel_outdoor.csv --operator Airtel
python3 ingest.py --csv path/to/jio_outdoor.csv --operator Jio
# or point it at everything at once: python3 ingest.py --csv "path/to/*.csv"
```

Two files land next to wherever you run it from -- **read them, they're
part of your provenance/limits panel, not just logs**:

- `rejected_rows.csv` -- rows that failed validation, with a reason column
- `unmapped_states.log` -- state names not found in `state_region_map.json`
  (fix real typos there; a genuinely new state name means the JSON needs
  another entry, not a guess)

At ~800k-900k rows per operator this should take a few minutes; it batches
inserts at 20k rows and refreshes the materialized view once at the end.

## 3. API

```bash
cd api
npm install
cp .env.example .env   # fill in your real DB/Redis values
npm start               # listens on :8094 by default
```

Check it's alive: `curl http://localhost:8094/health`

### 4. Frontend Server (Port 8099)

To serve the built frontend (`dist`) in a production/server environment:

```bash
cd api
npm run serve:frontend
```
This runs `frontend-server.js` on port `8099`, serves SPA files from `dashboard-frontend/dist`, and routes API calls to `http://192.168.8.10:8094`. Accessible over LAN at `http://192.168.8.10:8099`.

### Endpoints

| Endpoint | Powers |
|---|---|
| `GET /api/kpis?operator=&region=&state=&year_start=&year_end=&inout=` | KPI pills (volume, call-drop %, poor-voice %, avg rating) |
| `GET /api/state-quality?region=&year_start=&year_end=` | State choropleth / bubble map |
| `GET /api/state-quality/confidence?region=` | Per-state sample-size flag (low/medium/high n) |
| `GET /api/radar/:operator?region=&state=&year_start=&year_end=` | Radar profile, one operator per call |
| `GET /api/indoor-outdoor?operator=&region=&state=&year_start=&year_end=` | Indoor vs outdoor clustered bars |
| `GET /api/filters/options` | Populates the sidebar's region/state/year controls from real loaded data |

All filters are optional and combine with AND. All list endpoints are
Redis-cached (5 min default, `CACHE_TTL_SECONDS` in `.env`); if Redis is
unreachable the API still works, just uncached.

## Known gaps / things to decide before this is "done"

- **Radar axis formulas are opinionated, not neutral** (see comments in
  `services/queries.js`). "Coverage" = % of all seen states the operator
  has at least one report in -- decide if that is actually the metric you
  want before it goes in the case study.
- **GeoJSON join for the map** isn't wired up yet -- `state_name` values
  from the sheets (e.g. "NCT" for Delhi in the Jio file, "Orissa" vs
  "Odisha") need to be reconciled against whatever property name DataMeet's
  state boundaries use, or the choropleth join will silently drop states.
  Check this before you trust the map.
- **Sample-size imbalance is surfaced, not hidden.** `v_sample_confidence`
  and `/api/state-quality/confidence` exist so the UI can grey out or
  asterisk low-n states rather than let them look as certain as
  high-volume ones -- worth pointing to directly in your "What this
  doesn't show" panel.
