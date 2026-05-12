"""
Scrape YouTube video URLs from each listing page on offtheplan.com.au
and store in developments.video_url.

Run AFTER adding the column:
  ALTER TABLE developments ADD COLUMN IF NOT EXISTS video_url TEXT;

Usage:
    python supabase/scrape-video-urls.py
"""

import asyncio
import json
import re
import urllib.parse
from pathlib import Path

import httpx
from bs4 import BeautifulSoup
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
                    env[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    except FileNotFoundError:
        pass
    return env

env = read_env(".env.local")
SUPABASE_URL = env.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
SERVICE_ROLE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY", "")

REST_HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

# Listings confirmed to have videos
LISTINGS = [
    ("veue-norwest",                          "new-apartments/veue-norwest"),
    ("serai",                                  "new-apartments/serai"),
    ("lumiere-south-perth",                    "new-apartments/lumiere-south-perth"),
    ("marque",                                 "new-apartments/marque"),
    ("yarrabee-katoomba",                      "new-apartments/yarrabee-katoomba"),
    ("carrington-place",                       "new-apartments/carrington-place"),
    ("bella-vie",                              "new-apartments/bella-vie"),
    ("ayre-palm-beach",                        "new-apartments/ayre-palm-beach"),
    ("greenwich-chevron-island",               "new-apartments/greenwich-chevron-island"),
    ("kew-tallawong",                          "new-apartments/kew-tallawong"),
    ("avra",                                   "new-apartments/avra"),
    ("margaux",                                "new-apartments/margaux"),
    ("nautique-rushcutters-bay",               "new-apartments/nautique-rushcutters-bay"),
    ("mason-main",                             "new-apartments/mason-main"),
    ("dara-blacktown",                         "new-apartments/dara-blacktown"),
    ("adorn",                                  "new-apartments/adorn"),
    ("quarry-business-park",                   "commercial/quarry-business-park"),
    ("riva-como",                              "new-apartments/riva-como"),
    ("ellis-residences",                       "new-apartments/ellis-residences"),
    ("royale-randwick-terraces",               "new-apartments/royale-randwick-terraces"),
    ("8-robinson-ave-storage-micro-warehouses","commercial/8-robinson-ave-storage-micro-warehouses"),
    ("8-robinson-ave-showroom-and-factory-units","commercial/8-robinson-ave-showroom-and-factory-units"),
    ("penny-place-apartments",                 "new-apartments/penny-place-apartments"),
    ("perth-hub",                              "new-apartments/perth-hub"),
]

VIDEO_RE = re.compile(
    r'(?:youtube\.com/(?:embed/|watch\?v=|v/)|youtu\.be/|youtube\.com/shorts/)([A-Za-z0-9_\-]{11})'
    r'|vimeo\.com/(?:video/)?(\d{6,10})'
)

# ── Helpers ───────────────────────────────────────────────────────────────────

def extract_video_url(html: str) -> str | None:
    """Find a YouTube or Vimeo video URL anywhere in the page HTML/JS."""
    m = VIDEO_RE.search(html)
    if not m:
        return None
    yt_id, vimeo_id = m.group(1), m.group(2)
    if yt_id:
        return f"https://www.youtube.com/watch?v={yt_id}"
    if vimeo_id:
        return f"https://vimeo.com/{vimeo_id}"
    return None


def save_video_url(slug: str, video_url: str, client: httpx.Client) -> bool:
    url = f"{SUPABASE_URL}/rest/v1/developments?slug=eq.{urllib.parse.quote(slug)}"
    res = client.patch(url, json={"video_url": video_url}, headers=REST_HEADERS, timeout=15)
    return res.status_code in (200, 204)


# ── Main ──────────────────────────────────────────────────────────────────────

async def main():
    success = 0
    failed = 0
    not_found = 0

    with httpx.Client() as client:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )
            page = await context.new_page()

            for slug, url_path in LISTINGS:
                url = f"https://offtheplan.com.au/{url_path}"
                print(f"{slug[:50]}", end=" ... ", flush=True)

                try:
                    await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                    await page.wait_for_timeout(3000)
                except Exception as e:
                    print(f"LOAD FAIL ({e})")
                    failed += 1
                    continue

                video_url = None

                # Strategy 1: check HTML/data attributes before clicking
                html = await page.content()
                # Also scrape data-* attributes that may hold the video URL
                try:
                    for attr in ["data-video", "data-video-url", "data-src", "data-youtube", "data-url"]:
                        els = await page.query_selector_all(f"[{attr}]")
                        for el in els:
                            val = await el.get_attribute(attr) or ""
                            html += f" {val}"
                except Exception:
                    pass
                video_url = extract_video_url(html)

                # Strategy 2: click the Watch/video button, wait for YouTube iframe to appear
                if not video_url:
                    try:
                        # Find a button/element that looks like a Watch/video trigger
                        watch_btn = await page.query_selector(
                            "a[href*='youtube'], button[data-video], "
                            ".video-btn, .watch-btn, [class*='video'], "
                            "a[class*='video'], button[class*='video'], "
                            ".listing-video, [data-fancybox], [data-lightbox]"
                        )
                        if watch_btn:
                            await watch_btn.click()
                            await page.wait_for_timeout(3000)
                            # Now check for iframe that appeared
                            iframes = await page.query_selector_all("iframe")
                            for iframe in iframes:
                                src = await iframe.get_attribute("src") or ""
                                video_url = extract_video_url(src)
                                if video_url:
                                    break
                    except Exception:
                        pass

                # Strategy 3: get ALL iframe srcs after waiting (some may be lazy-loaded)
                if not video_url:
                    try:
                        iframes = await page.query_selector_all("iframe")
                        for iframe in iframes:
                            src = await iframe.get_attribute("src") or ""
                            data_src = await iframe.get_attribute("data-src") or ""
                            combined = src + " " + data_src
                            video_url = extract_video_url(combined)
                            if video_url:
                                break
                    except Exception:
                        pass

                if not video_url:
                    print("no video found")
                    not_found += 1
                    continue

                if save_video_url(slug, video_url, client):
                    print(f"OK  {video_url}")
                    success += 1
                else:
                    print(f"DB FAIL  ({video_url})")
                    failed += 1

                await asyncio.sleep(1.0)

            await browser.close()

    print(f"\nDone: {success} saved, {not_found} not found, {failed} failed")


if __name__ == "__main__":
    asyncio.run(main())
