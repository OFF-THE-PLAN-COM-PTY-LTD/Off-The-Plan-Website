"""
Off The Plan — Link agencies to their developments
====================================================
Reads scraped_agencies/agencies.json (which must include _listing_slugs),
then for each agency sets developments.agency_id where slug matches.

Run after:
  1. Apply migration 018_development_agency_id.sql in Supabase
  2. python supabase/scrape-agencies.py   (re-scrape to get _listing_slugs)
  3. python supabase/import-agencies.py   (upsert agency rows)

Usage:
    python supabase/link-agency-listings.py
"""

from __future__ import annotations

import json
import os
import re
import time
import urllib.parse
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
SUPABASE_URL = (env.get("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
SERVICE_ROLE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY") or ""

if not SUPABASE_URL or not SERVICE_ROLE_KEY:
    raise SystemExit("ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")

HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}

INPUT_FILE = Path("scraped_agencies/agencies.json")
DELAY = 0.2


def main() -> None:
    if not INPUT_FILE.exists():
        raise SystemExit(f"Not found: {INPUT_FILE} — run scrape-agencies.py first.")

    with open(INPUT_FILE, encoding="utf-8") as f:
        agencies: list[dict] = json.load(f)

    # Only process agencies that have listing slugs
    with_slugs = [(a, a.get("_listing_slugs", [])) for a in agencies if a.get("_listing_slugs")]
    print(f"Agencies with listing slugs: {len(with_slugs)} / {len(agencies)}")

    if not with_slugs:
        print("No listing slugs found — make sure you re-ran scrape-agencies.py first.")
        return

    linked = 0
    skipped = 0

    with httpx.Client(follow_redirects=True) as client:
        # Pre-fetch all agency IDs from Supabase (legacy_id -> uuid)
        res = client.get(
            f"{SUPABASE_URL}/rest/v1/agencies?select=id,legacy_id&limit=200",
            headers=HEADERS, timeout=30
        )
        res.raise_for_status()
        agency_map: dict[str, str] = {row["legacy_id"]: row["id"] for row in res.json() if row.get("legacy_id")}
        print(f"Loaded {len(agency_map)} agencies from Supabase\n")

        for agency, slugs in with_slugs:
            legacy_id = str(agency.get("legacy_id") or "")
            agency_uuid = agency_map.get(legacy_id)
            if not agency_uuid:
                print(f"  SKIP (no UUID found for legacy_id={legacy_id}): {agency.get('name')}")
                skipped += 1
                continue

            for slug in slugs:
                encoded = urllib.parse.quote(slug, safe="")
                res = client.patch(
                    f"{SUPABASE_URL}/rest/v1/developments?slug=eq.{encoded}",
                    json={"agency_id": agency_uuid},
                    headers={**HEADERS, "Prefer": "return=minimal"},
                    timeout=15,
                )
                if res.status_code in (200, 204):
                    print(f"  OK  {slug[:60]}  →  {agency.get('org_name') or agency.get('name')}")
                    linked += 1
                else:
                    print(f"  FAIL {slug}: {res.status_code} {res.text[:100]}")
                    skipped += 1
                time.sleep(DELAY)

    print(f"\nDone: {linked} developments linked, {skipped} skipped/failed")


if __name__ == "__main__":
    main()
