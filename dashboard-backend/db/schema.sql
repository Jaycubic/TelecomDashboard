-- =====================================================================
-- Airtel vs Jio Call Quality Dashboard -- schema
-- Target: PostgreSQL 13+
-- Run as:  psql -U <user> -d <db> -f schema.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- Fact table: one row per feedback report (Airtel + Jio, indoor + outdoor)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS call_quality_reports (
    id                  BIGSERIAL PRIMARY KEY,

    operator            VARCHAR(10)  NOT NULL,      -- 'Airtel' | 'Jio' (normalized on ingest)
    inout               VARCHAR(15)  NOT NULL,      -- 'Indoor' | 'Outdoor' | 'Travelling'
    network_type        VARCHAR(10),                -- '2G' | '3G' | '4G' | '5G' etc.
    rating              SMALLINT     NOT NULL,       -- 1-5
    calldrop_category   VARCHAR(30)  NOT NULL,       -- 'Call Dropped' | 'Poor Voice Quality' | 'Satisfactory'

    latitude            DOUBLE PRECISION,
    longitude           DOUBLE PRECISION,

    state_name          VARCHAR(60)  NOT NULL,       -- as given in source (not yet normalized spelling)
    region              VARCHAR(10),                 -- North/West/East/South, from state_region_map.json; NULL if unmapped

    month               SMALLINT,
    year                SMALLINT     NOT NULL,

    source_file         VARCHAR(120),                -- provenance: which CSV this row came from
    loaded_at           TIMESTAMP    NOT NULL DEFAULT now(),

    CONSTRAINT chk_operator  CHECK (operator IN ('Airtel', 'Jio')),
    CONSTRAINT chk_inout     CHECK (inout IN ('Indoor', 'Outdoor', 'Travelling')),
    CONSTRAINT chk_rating    CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT chk_year      CHECK (year BETWEEN 2000 AND 2100),
    CONSTRAINT chk_month     CHECK (month IS NULL OR month BETWEEN 1 AND 12),
    -- India's rough bounding box; NULL coords allowed (some feedback may lack GPS), but if present, sanity-check them
    CONSTRAINT chk_lat_range CHECK (latitude IS NULL OR latitude BETWEEN 6 AND 38),
    CONSTRAINT chk_lon_range CHECK (longitude IS NULL OR longitude BETWEEN 68 AND 98)
);

-- ---------------------------------------------------------------------
-- Indexes for the dashboard's actual filter/aggregation patterns
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cqr_operator           ON call_quality_reports (operator);
CREATE INDEX IF NOT EXISTS idx_cqr_state               ON call_quality_reports (state_name);
CREATE INDEX IF NOT EXISTS idx_cqr_region              ON call_quality_reports (region);
CREATE INDEX IF NOT EXISTS idx_cqr_year_month          ON call_quality_reports (year, month);
CREATE INDEX IF NOT EXISTS idx_cqr_inout               ON call_quality_reports (inout);
CREATE INDEX IF NOT EXISTS idx_cqr_calldrop_category   ON call_quality_reports (calldrop_category);

-- Composite index covering the most common combined filter: operator + state, scoped by year
CREATE INDEX IF NOT EXISTS idx_cqr_operator_state_year
    ON call_quality_reports (operator, state_name, year);

-- Composite index for the region-level radar/KPI queries
CREATE INDEX IF NOT EXISTS idx_cqr_operator_region
    ON call_quality_reports (operator, region);

-- ---------------------------------------------------------------------
-- Materialized view: per-state, per-operator summary.
-- The state choropleth and KPI pills read from this instead of scanning
-- ~1.6M raw rows on every request. Refresh after each ingestion run.
-- ---------------------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_state_operator_summary AS
SELECT
    state_name,
    region,
    operator,
    COUNT(*)                                                              AS total_reports,
    ROUND(AVG(rating)::numeric, 2)                                        AS avg_rating,
    ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Call Dropped')
          / NULLIF(COUNT(*), 0), 2)                                       AS call_drop_pct,
    ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Poor Voice Quality')
          / NULLIF(COUNT(*), 0), 2)                                       AS poor_voice_pct,
    ROUND(100.0 * COUNT(*) FILTER (WHERE calldrop_category = 'Satisfactory')
          / NULLIF(COUNT(*), 0), 2)                                       AS satisfactory_pct,
    ROUND(100.0 * COUNT(*) FILTER (WHERE inout = 'Indoor' AND calldrop_category = 'Satisfactory')
          / NULLIF(COUNT(*) FILTER (WHERE inout = 'Indoor'), 0), 2)       AS indoor_satisfactory_pct,
    ROUND(100.0 * COUNT(*) FILTER (WHERE inout = 'Outdoor' AND calldrop_category = 'Satisfactory')
          / NULLIF(COUNT(*) FILTER (WHERE inout = 'Outdoor'), 0), 2)      AS outdoor_satisfactory_pct
FROM call_quality_reports
GROUP BY state_name, region, operator;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_state_operator
    ON mv_state_operator_summary (state_name, operator);

-- Call this after every ingestion run:
--   REFRESH MATERIALIZED VIEW CONCURRENTLY mv_state_operator_summary;
-- (CONCURRENTLY needs the unique index above, which is already created)

-- ---------------------------------------------------------------------
-- Small lookup table so the sample-size imbalance is queryable, not just
-- eyeballed -- used to drive a confidence flag in the UI (e.g. grey out
-- a state's Airtel figure if n is too small to trust).
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_sample_confidence AS
SELECT
    state_name,
    operator,
    total_reports,
    CASE
        WHEN total_reports < 30  THEN 'low'       -- flag in UI, do not suppress -- just be honest about it
        WHEN total_reports < 100 THEN 'medium'
        ELSE 'high'
    END AS confidence
FROM mv_state_operator_summary;
