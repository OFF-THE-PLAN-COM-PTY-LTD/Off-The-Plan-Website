"""
Re-populate development_floor_plans with real beds / bath / garage / price_display
data from the scraped JSON files in the "Off plan 2" directory.

For each listing:
  1. Delete all existing floor plan rows for that development.
  2. Re-insert with correct beds, bath, garage, internal_sqm, price_from, price_display.

Usage:
    python supabase/repopulate-floor-plans.py
"""

import json
import os
import re
import urllib.parse
from pathlib import Path

import httpx

# ── Config ────────────────────────────────────────────────────────────────────

def read_env(path: str) -> dict:
    env = {}
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                m = re.match(r'^([A-Z0-9_]+)\s*=\s*(.*)$', line)
                if m:
                    env[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    except FileNotFoundError:
        pass
    return env

env = read_env(".env.local")
SUPABASE_URL = env.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
SERVICE_ROLE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
LISTINGS_DIR = Path("Off plan 2")

REST_HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

if not SUPABASE_URL or not SERVICE_ROLE_KEY:
    raise SystemExit("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")

# ── Helpers ───────────────────────────────────────────────────────────────────

def get_development_id(slug: str, client: httpx.Client) -> str | None:
    """Look up a development's UUID by slug."""
    url = f"{SUPABASE_URL}/rest/v1/developments?slug=eq.{urllib.parse.quote(slug)}&select=id"
    res = client.get(url, headers=REST_HEADERS, timeout=15)
    rows = res.json()
    if rows:
        return rows[0]["id"]
    return None


def delete_floor_plans(dev_id: str, client: httpx.Client) -> bool:
    url = f"{SUPABASE_URL}/rest/v1/development_floor_plans?development_id=eq.{dev_id}"
    res = client.delete(url, headers=REST_HEADERS, timeout=15)
    return res.status_code in (200, 204)


def insert_floor_plans(records: list[dict], client: httpx.Client) -> bool:
    if not records:
        return True
    url = f"{SUPABASE_URL}/rest/v1/development_floor_plans"
    res = client.post(url, json=records, headers=REST_HEADERS, timeout=15)
    return res.status_code in (200, 201)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    success = 0
    skipped = 0
    failed = 0
    seen_slugs: set[str] = set()

    with httpx.Client() as client:
        dirs = sorted(LISTINGS_DIR.iterdir())
        for listing_dir in dirs:
            if not listing_dir.is_dir():
                continue

            json_path = listing_dir / f"{listing_dir.name}.json"
            if not json_path.exists():
                print(f"SKIP  {listing_dir.name}  (no JSON)")
                skipped += 1
                continue

            try:
                data = json.loads(json_path.read_text(encoding="utf-8", errors="replace"))
            except Exception as e:
                print(f"SKIP  {listing_dir.name}  (JSON parse error: {e})")
                skipped += 1
                continue

            slug: str = data.get("project_overview", {}).get("slug", "")
            if not slug:
                skipped += 1
                continue

            if slug in seen_slugs:
                print(f"SKIP  {slug}  (duplicate)")
                skipped += 1
                continue
            seen_slugs.add(slug)

            config = data.get("configuration_summary", {})
            floor_plans_raw: list[dict] = config.get("floor_plans", [])

            if not floor_plans_raw:
                print(f"SKIP  {slug}  (no floor_plans in JSON)")
                skipped += 1
                continue

            # Look up DB row
            dev_id = get_development_id(slug, client)
            if not dev_id:
                print(f"FAIL  {slug}  (not found in DB)")
                failed += 1
                continue

            # Delete old rows
            if not delete_floor_plans(dev_id, client):
                print(f"FAIL  {slug}  (delete failed)")
                failed += 1
                continue

            # Build new records
            records = []
            for fp in floor_plans_raw:
                price_from_raw = fp.get("price_from")
                price_display = fp.get("price_display") or None  # e.g. "Contact Agent"

                # price_from is stored as cents in DB (dollars × 100)
                price_from_cents: int | None = None
                if price_from_raw is not None:
                    try:
                        price_from_cents = int(float(price_from_raw) * 100)
                    except (TypeError, ValueError):
                        pass

                beds = fp.get("beds")
                bath = fp.get("bath")
                garage = fp.get("garage")
                internal_sqm = fp.get("internal_sqm")

                # Build a human-readable config label as a fallback
                parts = []
                if beds is not None:
                    parts.append(f"{beds} bed")
                if bath is not None:
                    parts.append(f"{bath} bath")
                if garage is not None:
                    parts.append(f"{garage} car")
                config_label = ", ".join(parts) if parts else None

                records.append({
                    "development_id": dev_id,
                    "plan_type": None,
                    "config": config_label,
                    "beds": beds,
                    "bath": bath,
                    "garage": garage,
                    "internal_sqm": internal_sqm,
                    "price_from": price_from_cents,
                    "price_display": price_display,
                    "image_url": None,
                })

            if insert_floor_plans(records, client):
                print(f"OK    {slug}  ({len(records)} plans)")
                success += 1
            else:
                print(f"FAIL  {slug}  (insert failed)")
                failed += 1

    print(f"\nDone: {success} updated, {skipped} skipped, {failed} failed")


if __name__ == "__main__":
    main()
