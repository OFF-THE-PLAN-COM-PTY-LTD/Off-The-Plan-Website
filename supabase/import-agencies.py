"""
Off The Plan — Import agencies into Supabase
=============================================
Reads scraped_agencies/agencies.json and upserts all records into the
agencies table using the Supabase REST API (service role key).

Run the migration first:
  Apply supabase/migrations/015_agencies.sql in your Supabase SQL editor.

Requirements:
    pip install httpx

Usage:
    python supabase/import-agencies.py
"""

from __future__ import annotations

import json
import os
import re
import time
from pathlib import Path


import httpx

# ── Config ────────────────────────────────────────────────────────────────────

def read_env(path: str) -> dict[str, str]:
    env: dict[str, str] = {}
    try:
        with open(path, encoding="utf-8") as f:
            for raw in f:
                line = raw.strip()
                if not line or line.startswith("#"):
                    continue
                m = re.match(r"^([A-Za-z0-9_]+)\s*=\s*(.*)$", line)
                if m:
                    env[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    except FileNotFoundError:
        pass
    return env


env = read_env(".env.local")
SUPABASE_URL = (env.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")).rstrip("/")
SERVICE_ROLE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SERVICE_ROLE_KEY:
    raise SystemExit("ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")

REST_HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}

INPUT_FILE = Path("scraped_agencies/agencies.json")
BATCH_SIZE = 50
DELAY = 0.3


# ── Helpers ───────────────────────────────────────────────────────────────────

def check_connection(client: httpx.Client) -> None:
    url = f"{SUPABASE_URL}/rest/v1/agencies?select=id&limit=1"
    res = client.get(url, headers=REST_HEADERS, timeout=15)
    if res.status_code == 200:
        print("Supabase connection OK")
        return
    if res.status_code == 404:
        raise SystemExit(
            "agencies table not found — run supabase/migrations/015_agencies.sql in the Supabase SQL editor first."
        )
    raise SystemExit(f"Supabase check failed: {res.status_code} {res.text[:200]}")


def upsert_batch(client: httpx.Client, records: list[dict]) -> tuple[int, int]:
    url = f"{SUPABASE_URL}/rest/v1/agencies"
    conflict_key = "legacy_id"
    # If legacy_id is None for all records, fall back to email
    has_legacy = any(r.get("legacy_id") for r in records)
    if not has_legacy:
        conflict_key = "email"
        url += "?on_conflict=email"
    else:
        url += "?on_conflict=legacy_id"

    headers = {**REST_HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal"}
    res = client.post(url, json=records, headers=headers, timeout=30)
    if res.status_code in (200, 201):
        return len(records), 0
    print(f"  Batch failed: {res.status_code} {res.text[:300]}")
    return 0, len(records)


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    if not INPUT_FILE.exists():
        raise SystemExit(f"Input file not found: {INPUT_FILE}\nRun scrape-agencies.py first.")

    with open(INPUT_FILE, encoding="utf-8") as f:
        raw_agencies: list[dict] = json.load(f)

    # Strip private _* fields that don't exist as DB columns
    agencies = [{k: v for k, v in a.items() if not k.startswith("_")} for a in raw_agencies]

    print(f"Loaded {len(agencies)} agencies from {INPUT_FILE}")

    with httpx.Client(follow_redirects=True) as client:
        check_connection(client)

        success = 0
        failures = 0
        batches = [agencies[i:i + BATCH_SIZE] for i in range(0, len(agencies), BATCH_SIZE)]

        for i, batch in enumerate(batches, 1):
            print(f"Upserting batch {i}/{len(batches)} ({len(batch)} records) ...")
            ok, fail = upsert_batch(client, batch)
            success += ok
            failures += fail
            if i < len(batches):
                time.sleep(DELAY)

    print(f"\nDone: {success} upserted, {failures} failed")
    if success > 0:
        print("All Agencies data is now in Supabase.")


if __name__ == "__main__":
    main()
