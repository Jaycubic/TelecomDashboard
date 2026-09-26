#!/usr/bin/env python3
"""
ingest.py -- load Airtel/Jio call-quality CSVs into PostgreSQL.

Expected source columns (case-insensitive, matches both sheets you shared):
    inout | operator | network_type | rating | calldrop_category |
    latitude | longitude | state_name | month | year

Usage
-----
    python ingest.py --csv data/airtel_indoor.csv --operator Airtel
    python ingest.py --csv data/jio_outdoor.csv --operator Jio
    python ingest.py --csv data/*.csv                     # operator read from each file's own 'operator' column
    python ingest.py --csv data/airtel.csv --refresh-only  # just refresh the materialized view, skip loading

Env vars:
    DBPB_HOST, DBPB_PORT, DBPB_USER, DBPB_PASSWORD, DBPB_NAME, DBPB_SCHEMA
    (also falls back to DBP_HOST, DBP_PORT, etc.)

Notes
-----
- Uses psycopg2's execute_values for fast batched inserts. At ~1.5M
  combined rows this comfortably beats row-by-row INSERTs; if you
  outgrow this too, switch to COPY (see _bulk_copy() below, unused but
  left in as a drop-in replacement).
- Rows that fail validation are NOT silently dropped -- they're written
  to `rejected_rows.csv` with a reason column, so you have something
  concrete for the "What this doesn't show" panel and the case study's
  provenance section.
- State names are NOT auto-corrected/fuzzy-matched. A typo'd state name
  just won't find a region in state_region_map.json and will load with
  region = NULL, and gets logged to unmapped_states.log. Silently
  guessing would be exactly the kind of unlabelled data-fixing your
  assignment brief tells you not to do.
"""

import argparse
import csv
import glob
import json
import logging
import math
import os
import sys
from pathlib import Path

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

try:
    from dotenv import find_dotenv, load_dotenv
    load_dotenv(find_dotenv())
except ImportError:
    pass

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("ingest")

SCRIPT_DIR = Path(__file__).resolve().parent
REGION_MAP_PATH = SCRIPT_DIR.parent / "state_region_map.json"

REQUIRED_COLUMNS = [
    "inout", "operator", "network_type", "rating",
    "calldrop_category", "latitude", "longitude",
    "state_name", "month", "year",
]

VALID_INOUT = {"indoor", "outdoor"}
VALID_CALLDROP_CATEGORY = {"call dropped", "poor voice quality", "satisfactory"}

# Canonical state names, matching the ST_NM property values in the DataMeet
# state boundaries used by the frontend map (src/data/india-states-topo.json).
# Without this, the same real-world state loads under two different spellings
# depending on which operator's export it came from -- confirmed directly:
# the Jio sample uses "NCT" for Delhi, other sources use "Delhi" outright.
# That would silently split one state's reports into two states_name buckets
# (breaking both the state filter AND the map join), so we canonicalize once,
# here, rather than solving it twice in the frontend and the API.
STATE_NAME_CANON = {
    "nct": "NCT of Delhi",
    "delhi": "NCT of Delhi",
    "nct of delhi": "NCT of Delhi",
    "new delhi": "NCT of Delhi",
    "orissa": "Odisha",
    "pondicherry": "Puducherry",
    "uttaranchal": "Uttarakhand",
    "jammu and kashmir": "Jammu & Kashmir",
    "j&k": "Jammu & Kashmir",
    "andaman and nicobar islands": "Andaman & Nicobar Island",
    "andaman & nicobar islands": "Andaman & Nicobar Island",
    "dadra and nagar haveli": "Dadara & Nagar Havelli",
    "dadra & nagar haveli": "Dadara & Nagar Havelli",
    "daman and diu": "Daman & Diu",
    "arunachal pradesh": "Arunanchal Pradesh",  # DataMeet's own source has this spelling
}


def canonicalize_state_name(raw: str) -> str:
    """Map a raw state_name to the spelling the map/GeoJSON expects.
    Anything not in STATE_NAME_CANON is assumed to already match (true for
    most states, e.g. 'Karnataka' needs no translation)."""
    return STATE_NAME_CANON.get(raw.strip().lower(), raw.strip())

INSERT_SQL = """
    INSERT INTO call_quality_reports (
        operator, inout, network_type, rating, calldrop_category,
        latitude, longitude, state_name, region, month, year, source_file
    ) VALUES %s
"""


def load_region_map(path: Path) -> dict:
    """Flatten state_region_map.json into {state_name_lower: region}."""
    with open(path, "r", encoding="utf-8") as f:
        raw = json.load(f)

    lookup = {}
    for region, states in raw.items():
        if region.startswith("_"):
            continue
        for state in states:
            lookup[state.strip().lower()] = region
    return lookup


def get_db_connection():
    schema = os.getenv("DBPB_SCHEMA") or os.getenv("DBP_SCHEMA") or "public"
    return psycopg2.connect(
        dbname=os.getenv("DBPB_NAME") or os.getenv("DBP_NAME") or "dashboard",
        user=os.getenv("DBPB_USER") or os.getenv("DBP_USER") or "jofrey",
        password=os.getenv("DBPB_PASSWORD") or os.getenv("DBP_PASSWORD") or "2025",
        host=os.getenv("DBPB_HOST") or os.getenv("DBP_HOST") or "localhost",
        port=int(os.getenv("DBPB_PORT") or os.getenv("DBP_PORT") or "5432"),
        options=f"-c search_path={schema}",
    )


def normalize_operator(value: str) -> str:
    v = str(value).strip().lower()
    if v == "airtel":
        return "Airtel"
    if v == "jio":
        return "Jio"
    return str(value).strip()  # leave as-is, will fail the CHECK constraint and surface loudly


def normalize_inout(value: str) -> str:
    v = str(value).strip().lower()
    return "Indoor" if v == "indoor" else "Outdoor" if v == "outdoor" else str(value).strip()


def validate_and_clean(df: pd.DataFrame, source_label: str, region_lookup: dict):
    """
    Returns (clean_df, rejected_df, unmapped_states_counter).
    Nothing here silently invents data -- rows that don't fit are rejected
    with a reason, not coerced.
    """
    df = df.copy()
    df.columns = [c.strip().lower() for c in df.columns]

    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"{source_label}: missing required columns {missing}")

    df["operator"] = df["operator"].apply(normalize_operator)
    df["inout"] = df["inout"].apply(normalize_inout)
    df["state_name"] = df["state_name"].astype(str).str.strip().apply(canonicalize_state_name)
    df["calldrop_category"] = df["calldrop_category"].astype(str).str.strip()
    df["network_type"] = df["network_type"].astype(str).str.strip()

    reasons = pd.Series([""] * len(df), index=df.index)

    def flag(mask, reason):
        nonlocal reasons
        reasons.loc[mask & (reasons == "")] = reason

    flag(~df["operator"].isin(["Airtel", "Jio"]), "invalid_operator")
    flag(~df["inout"].isin(["Indoor", "Outdoor"]), "invalid_inout")
    flag(~df["calldrop_category"].str.lower().isin(VALID_CALLDROP_CATEGORY), "invalid_calldrop_category")

    rating_numeric = pd.to_numeric(df["rating"], errors="coerce")
    flag(rating_numeric.isna() | ~rating_numeric.between(1, 5), "invalid_rating")
    df["rating"] = rating_numeric

    year_numeric = pd.to_numeric(df["year"], errors="coerce")
    flag(year_numeric.isna() | ~year_numeric.between(2000, 2100), "invalid_year")
    df["year"] = year_numeric

    month_numeric = pd.to_numeric(df["month"], errors="coerce")
    flag(month_numeric.notna() & ~month_numeric.between(1, 12), "invalid_month")
    df["month"] = month_numeric  # may legitimately be NaN; cleaned at insert time

    lat_numeric = pd.to_numeric(df["latitude"], errors="coerce")
    lon_numeric = pd.to_numeric(df["longitude"], errors="coerce")
    flag(lat_numeric.notna() & ~lat_numeric.between(6, 38), "latitude_outside_india_bbox")
    flag(lon_numeric.notna() & ~lon_numeric.between(68, 98), "longitude_outside_india_bbox")
    df["latitude"] = lat_numeric
    df["longitude"] = lon_numeric

    df["region"] = df["state_name"].str.lower().map(region_lookup)
    # Unknown state names map to NaN here. We deliberately do NOT try to
    # coerce that to None at the dataframe level: pandas silently re-
    # normalizes None back to NaN for object/string-typed columns, so the
    # coercion looks like it works but doesn't. All NaN -> SQL NULL
    # conversion happens in one place, right before insert -- see
    # _clean_for_insert() / bulk_insert() below.
    unmapped_counter = (
        df.loc[df["region"].isna(), "state_name"]
        .value_counts()
        .to_dict()
    )

    rejected_mask = reasons != ""
    rejected_df = df.loc[rejected_mask].copy()
    rejected_df["reject_reason"] = reasons.loc[rejected_mask]

    clean_df = df.loc[~rejected_mask].copy()
    clean_df["source_file"] = source_label

    return clean_df, rejected_df, unmapped_counter


def _clean_for_insert(value):
    """
    Replace any flavour of pandas/numpy 'missing' (float NaN, pd.NA) with
    a real Python None so psycopg2 emits SQL NULL. Without this, a NaN in
    an object/string column gets adapted as the literal text 'NaN' rather
    than NULL -- a real bug caught by testing this ingestion path against
    a live Postgres instance before handing the script over.
    """
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    return value


def bulk_insert(conn, df: pd.DataFrame, batch_size: int = 20_000):
    cols = [
        "operator", "inout", "network_type", "rating", "calldrop_category",
        "latitude", "longitude", "state_name", "region", "month", "year", "source_file",
    ]
    records = [
        tuple(_clean_for_insert(v) for v in row)
        for row in df[cols].itertuples(index=False, name=None)
    ]

    with conn.cursor() as cur:
        for i in range(0, len(records), batch_size):
            chunk = records[i:i + batch_size]
            execute_values(cur, INSERT_SQL, chunk, page_size=batch_size)
            conn.commit()
            log.info("  inserted %d/%d rows", min(i + batch_size, len(records)), len(records))


def refresh_materialized_view(conn):
    with conn.cursor() as cur:
        cur.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_state_operator_summary;")
    conn.commit()
    log.info("Refreshed mv_state_operator_summary")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--csv", nargs="+", required=True, help="CSV file(s) or glob pattern(s)")
    parser.add_argument("--operator", choices=["Airtel", "Jio"], default=None,
                         help="Force operator for all rows in these files (overrides the file's own 'operator' column)")
    parser.add_argument("--refresh-only", action="store_true",
                         help="Skip loading, just refresh the materialized view")
    parser.add_argument("--rejected-out", default="rejected_rows.csv")
    parser.add_argument("--unmapped-log", default="unmapped_states.log")
    args = parser.parse_args()

    conn = get_db_connection()

    if args.refresh_only:
        refresh_materialized_view(conn)
        conn.close()
        return

    region_lookup = load_region_map(REGION_MAP_PATH)

    files = []
    for pattern in args.csv:
        matched = glob.glob(pattern)
        files.extend(matched if matched else [pattern])

    if not files:
        log.error("No files matched: %s", args.csv)
        sys.exit(1)

    all_rejected = []
    all_unmapped = {}
    total_loaded = 0

    for path in files:
        log.info("Reading %s", path)
        df = pd.read_csv(path)

        if args.operator:
            df["operator"] = args.operator

        clean_df, rejected_df, unmapped = validate_and_clean(df, source_label=os.path.basename(path),
                                                               region_lookup=region_lookup)

        log.info("  %s: %d clean rows, %d rejected", path, len(clean_df), len(rejected_df))

        if not rejected_df.empty:
            all_rejected.append(rejected_df)
        for state, count in unmapped.items():
            all_unmapped[state] = all_unmapped.get(state, 0) + count

        if not clean_df.empty:
            bulk_insert(conn, clean_df)
            total_loaded += len(clean_df)

    if all_rejected:
        combined_rejected = pd.concat(all_rejected, ignore_index=True)
        combined_rejected.to_csv(args.rejected_out, index=False)
        log.warning("Wrote %d rejected rows to %s -- use this for your provenance/limits panel",
                    len(combined_rejected), args.rejected_out)

    if all_unmapped:
        with open(args.unmapped_log, "w", encoding="utf-8") as f:
            for state, count in sorted(all_unmapped.items(), key=lambda kv: -kv[1]):
                f.write(f"{state}: {count} rows loaded with region=NULL\n")
        log.warning("%d distinct state names had no region mapping -- see %s "
                    "(add them to state_region_map.json, don't guess)",
                    len(all_unmapped), args.unmapped_log)

    refresh_materialized_view(conn)
    conn.close()
    log.info("Done. Loaded %d rows total.", total_loaded)


def _bulk_copy(conn, csv_path: str, columns: list):
    """
    Unused by default -- kept as a drop-in for when you outgrow
    execute_values (e.g. if you ever load the full raw files in one shot
    instead of per-source CSVs). COPY is the fastest bulk-load path in
    Postgres, but skips the per-row validation above, so only point it
    at a CSV you've already cleaned through validate_and_clean().
    """
    with conn.cursor() as cur, open(csv_path, "r", encoding="utf-8") as f:
        cur.copy_expert(
            f"COPY call_quality_reports ({', '.join(columns)}) FROM STDIN WITH CSV HEADER",
            f,
        )
    conn.commit()


if __name__ == "__main__":
    main()
