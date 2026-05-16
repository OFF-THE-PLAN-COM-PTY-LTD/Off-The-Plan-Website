"""
Off The Plan — Import news articles into Supabase
===================================================
Reads scraped_news/news.json and upserts into journal_articles
(category = 'News') using the Supabase REST API.

Run after:
    python supabase/scrape-news.py

Requirements:
    pip install httpx

Usage:
    python supabase/import-news.py
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
SUPABASE_URL      = (env.get("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
SERVICE_ROLE_KEY  = env.get("SUPABASE_SERVICE_ROLE_KEY") or ""

if not SUPABASE_URL or not SERVICE_ROLE_KEY:
    raise SystemExit("ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")

HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}

INPUT_FILE = Path("scraped_news/news.json")
BATCH_SIZE = 20
DELAY      = 0.3


# ── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    if not INPUT_FILE.exists():
        raise SystemExit(f"Input file not found: {INPUT_FILE}\nRun scrape-news.py first.")

    with open(INPUT_FILE, encoding="utf-8") as f:
        raw: list[dict] = json.load(f)

    # Build records — always set category = "News", strip unknown keys
    allowed = {"title", "slug", "hero_image_url", "body_html", "is_published", "published_at"}
    records = []
    for item in raw:
        record = {k: v for k, v in item.items() if k in allowed}
        record["category"] = "News"
        if not record.get("title") or not record.get("slug"):
            continue
        records.append(record)

    print(f"Loaded {len(records)} news articles from {INPUT_FILE}")

    url = f"{SUPABASE_URL}/rest/v1/journal_articles?on_conflict=slug"
    upsert_headers = {**HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal"}

    success = 0
    failures = 0
    batches = [records[i:i + BATCH_SIZE] for i in range(0, len(records), BATCH_SIZE)]

    with httpx.Client(follow_redirects=True) as client:
        for i, batch in enumerate(batches, 1):
            print(f"Upserting batch {i}/{len(batches)} ({len(batch)} records) ...")
            res = client.post(url, json=batch, headers=upsert_headers, timeout=30)
            if res.status_code in (200, 201):
                success += len(batch)
            else:
                print(f"  Batch failed: {res.status_code} {res.text[:300]}")
                failures += len(batch)
            if i < len(batches):
                time.sleep(DELAY)

    print(f"\nDone: {success} upserted, {failures} failed")
    if success > 0:
        print("News articles are now in Supabase under category='News'.")


if __name__ == "__main__":
    main()
