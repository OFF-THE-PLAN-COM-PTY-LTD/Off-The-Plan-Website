"""
Off The Plan — Article hero image fetcher
==========================================
Visits each article's detail page on offtheplan.com.au, grabs the main_image
from their S3 bucket, uploads it to our Supabase Storage 'journal' bucket,
and updates hero_image_url in journal_articles.

Requirements:
    pip install playwright httpx beautifulsoup4
    python -m playwright install chromium

Usage:
    python supabase/fetch-article-images.py
"""

import asyncio
import mimetypes
import os
import re
import urllib.parse
from pathlib import Path

import httpx
from playwright.async_api import async_playwright

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
                    k, v = m.group(1), m.group(2).strip().strip('"').strip("'")
                    env[k] = v
    except FileNotFoundError:
        pass
    return env

env = read_env(".env.local")
SUPABASE_URL = (env.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")).rstrip("/")
SERVICE_ROLE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SERVICE_ROLE_KEY:
    raise SystemExit("ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")

STORAGE_BUCKET = "journal"
REST_HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}

# ── Supabase helpers ──────────────────────────────────────────────────────────

def get_articles(client: httpx.Client) -> list[dict]:
    res = client.get(
        f"{SUPABASE_URL}/rest/v1/journal_articles?select=id,slug,category&is_published=eq.true&order=published_at.desc",
        headers=REST_HEADERS,
        timeout=15,
    )
    return res.json() if res.status_code == 200 else []

def update_hero_url(slug: str, url: str, client: httpx.Client) -> bool:
    res = client.patch(
        f"{SUPABASE_URL}/rest/v1/journal_articles?slug=eq.{urllib.parse.quote(slug)}",
        json={"hero_image_url": url},
        headers={**REST_HEADERS, "Prefer": "return=minimal"},
        timeout=15,
    )
    return res.status_code in (200, 204)

def upload_image(data: bytes, storage_path: str, mime: str, client: httpx.Client) -> str | None:
    upload_headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": mime,
        "x-upsert": "true",
    }
    res = client.post(
        f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{storage_path}",
        content=data,
        headers=upload_headers,
        timeout=60,
    )
    if res.status_code not in (200, 201):
        print(f"    Upload failed: {res.status_code} {res.text[:100]}")
        return None
    return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{storage_path}"

# ── Scraping ──────────────────────────────────────────────────────────────────

async def get_main_image(page, url: str) -> str | None:
    """Visit an article detail page and return the main_image S3 URL if found."""
    try:
        await page.goto(url, wait_until="networkidle", timeout=25000)
        await page.wait_for_timeout(2000)
    except Exception as e:
        print(f"    Page load failed: {e}")
        return None

    imgs = await page.evaluate("""() =>
        Array.from(document.querySelectorAll('img'))
            .filter(i => i.src.includes('s3.ap-southeast') && i.src.includes('main_image'))
            .map(i => i.src)
    """)
    return imgs[0] if imgs else None

# ── Main ──────────────────────────────────────────────────────────────────────

async def main():
    with httpx.Client(follow_redirects=True) as client:
        articles = get_articles(client)
        print(f"Found {len(articles)} articles in DB\n")

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )
            bpage = await context.new_page()

            success = 0
            skipped = 0

            for article in articles:
                slug = article["slug"]
                category = article["category"]
                section = "guides" if category == "Guide" else "news"
                detail_url = f"https://offtheplan.com.au/{section}/{slug}"

                print(f"[{section}] {slug[:55]}")

                img_url = await get_main_image(bpage, detail_url)

                if not img_url:
                    print("    No main_image found — skipping")
                    skipped += 1
                    await asyncio.sleep(1)
                    continue

                print(f"    Found: {img_url[-60:]}")

                # Download from S3
                try:
                    r = client.get(img_url, timeout=30)
                    r.raise_for_status()
                    img_data = r.content
                except Exception as e:
                    print(f"    Download failed: {e}")
                    skipped += 1
                    await asyncio.sleep(1)
                    continue

                # Derive extension
                parsed = urllib.parse.urlparse(img_url)
                ext = os.path.splitext(urllib.parse.unquote(parsed.path))[-1] or ".jpg"
                mime = mimetypes.guess_type(f"file{ext}")[0] or "image/jpeg"
                storage_path = f"{slug}/hero{ext}"

                # Upload to Supabase Storage
                public_url = upload_image(img_data, storage_path, mime, client)
                if not public_url:
                    skipped += 1
                    await asyncio.sleep(1)
                    continue

                # Update DB
                if update_hero_url(slug, public_url, client):
                    print(f"    OK saved ({len(img_data) // 1024} KB)")
                    success += 1
                else:
                    print("    DB update failed")
                    skipped += 1

                await asyncio.sleep(1.5)  # be polite

            await browser.close()

        print(f"\nDone: {success} images saved, {skipped} skipped")


if __name__ == "__main__":
    asyncio.run(main())
