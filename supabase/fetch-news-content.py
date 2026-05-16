"""
Off The Plan — Fetch full body content for scraped news articles
================================================================
Reads scraped_news/news.json, logs into the old admin, re-fetches the
news list to get article IDs, then visits each article's edit/detail page
to extract body, subtitle, hero image, and other fields.

Updates scraped_news/news.json in-place, then re-imports to Supabase.

Requirements:
    pip install playwright beautifulsoup4 httpx
    python -m playwright install chromium

Usage:
    python supabase/fetch-news-content.py
"""

from __future__ import annotations

import asyncio
import json
import re
import time
from pathlib import Path

from bs4 import BeautifulSoup
from playwright.async_api import async_playwright, Page

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
ADMIN_BASE  = env.get("OLD_ADMIN_URL", "").rstrip("/")
ADMIN_EMAIL = env.get("OLD_ADMIN_EMAIL", "")
ADMIN_PASS  = env.get("OLD_ADMIN_PASSWORD", "")

if not ADMIN_BASE or not ADMIN_EMAIL or not ADMIN_PASS:
    raise SystemExit("ERROR: Missing OLD_ADMIN_URL, OLD_ADMIN_EMAIL or OLD_ADMIN_PASSWORD in .env.local")

NEWS_JSON   = Path("scraped_news/news.json")
NEWS_API    = "https://offtheplan.com.au/api/manage_news_and_events_list/get_all_data"
ADMIN_NEWS  = "https://offtheplan.com.au/manage_news_and_events_list"
DELAY       = 1.2


# ── Login ─────────────────────────────────────────────────────────────────────

async def login(page: Page) -> None:
    print(f"Logging in via {ADMIN_BASE} ...")
    await page.goto(ADMIN_BASE, wait_until="networkidle", timeout=30000)
    await page.wait_for_timeout(2000)
    if any(kw in page.url.lower() for kw in ["login", "signin", "auth"]):
        await _fill_login(page)
        await page.wait_for_timeout(3000)
        await page.wait_for_load_state("networkidle")
    print(f"  Logged in — now at: {page.url}")


async def _fill_login(page: Page) -> None:
    for sel in ['input[type="email"]', 'input[name="email"]']:
        if await page.locator(sel).count() > 0:
            await page.fill(sel, ADMIN_EMAIL); break
    for sel in ['input[type="password"]', 'input[name="password"]']:
        if await page.locator(sel).count() > 0:
            await page.fill(sel, ADMIN_PASS); break
    for sel in ['button[type="submit"]', 'button:has-text("Login")', 'button:has-text("Sign in")']:
        if await page.locator(sel).count() > 0:
            await page.click(sel); return
    await page.keyboard.press("Enter")


# ── Fetch raw list from API (to get IDs) ──────────────────────────────────────

async def fetch_raw_list(page: Page) -> list[dict]:
    print(f"\nFetching raw article list from API ...")
    result = await page.evaluate(f"""
        fetch("{NEWS_API}", {{
            headers: {{ "Accept": "application/json", "X-Requested-With": "XMLHttpRequest" }}
        }}).then(r => r.json()).catch(e => null)
    """)
    if not result:
        print("  API fetch failed")
        return []

    # Find the list in the response
    items = result if isinstance(result, list) else []
    if not items and isinstance(result, dict):
        for v in result.values():
            if isinstance(v, list) and len(v) > 0:
                items = v
                break

    print(f"  Got {len(items)} items from API")
    return items


# ── Fetch article detail ───────────────────────────────────────────────────────

def slugify(title: str) -> str:
    s = title.lower().strip()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s)
    return re.sub(r"-+", "-", s)[:200]


async def fetch_article_detail(page: Page, article_id: str | int) -> dict:
    """Visit the admin edit page for one article and extract all fields."""
    # Try common edit URL patterns
    edit_urls = [
        f"{ADMIN_NEWS}/{article_id}",
        f"{ADMIN_NEWS}/edit/{article_id}",
        f"{ADMIN_NEWS}?id={article_id}",
        f"{ADMIN_BASE}/admin/news-and-events/{article_id}",
    ]

    for url in edit_urls:
        try:
            await page.goto(url, wait_until="networkidle", timeout=20000)
            await page.wait_for_timeout(1500)
            html  = await page.content()
            soup  = BeautifulSoup(html, "html.parser")

            # Check if we got a valid edit page (not 404)
            title_input = soup.find("input", {"name": re.compile(r"title", re.I)})
            content_area = (
                soup.find("textarea", {"name": re.compile(r"body|content|description", re.I)})
                or soup.select_one(".ql-editor")
                or soup.select_one(".ProseMirror")
                or soup.select_one('[contenteditable="true"]')
            )

            if title_input or content_area:
                return extract_from_page(soup, page.url)

        except Exception as e:
            continue

    return {}


def extract_from_page(soup: BeautifulSoup, url: str) -> dict:
    result: dict = {}

    # Title
    for sel in [{"name": re.compile(r"^title$", re.I)}, {"id": re.compile(r"title", re.I)}]:
        el = soup.find("input", sel)
        if el and el.get("value"):
            result["title"] = el["value"].strip()
            break

    # Subtitle
    for sel in [{"name": re.compile(r"subtitle", re.I)}, {"id": re.compile(r"subtitle", re.I)}]:
        el = soup.find("input", sel)
        if el and el.get("value"):
            result["subtitle"] = el["value"].strip()
            break

    # Body/content — try textarea first, then rich editor divs
    body = ""
    textarea = soup.find("textarea", {"name": re.compile(r"body|content|description", re.I)})
    if textarea:
        body = textarea.get_text(separator="\n", strip=True)
    else:
        for css in [".ql-editor", ".ProseMirror", '[contenteditable="true"]']:
            el = soup.select_one(css)
            if el:
                body = str(el)
                break

    if body:
        result["body_html"] = body

    # Images — look for img tags with src in form containers
    imgs = soup.select("form img, .image-preview img, .preview img")
    img_urls = [i["src"] for i in imgs if i.get("src") and i["src"].startswith("http")]
    if img_urls:
        result["hero_image_url"] = img_urls[0]
        if len(img_urls) > 1:
            result["list_page_image_url"] = img_urls[1]
        if len(img_urls) > 2:
            result["article_image_one"] = img_urls[2]
        if len(img_urls) > 3:
            result["article_image_two"] = img_urls[3]

    # Meta title/content
    for name, key in [("meta_title", "meta_title"), ("meta_content", "meta_content"),
                      ("meta-title", "meta_title"), ("meta-description", "meta_content")]:
        el = soup.find(["input", "textarea"], {"name": re.compile(name, re.I)})
        if el:
            val = el.get("value") or el.get_text(strip=True)
            if val:
                result[key] = val.strip()

    return result


# ── Main ─────────────────────────────────────────────────────────────────────

async def main() -> None:
    if not NEWS_JSON.exists():
        raise SystemExit(f"Not found: {NEWS_JSON} — run scrape-news.py first.")

    with open(NEWS_JSON, encoding="utf-8") as f:
        articles: list[dict] = json.load(f)

    print(f"Loaded {len(articles)} articles from {NEWS_JSON}")

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=False)
        ctx     = await browser.new_context()
        page    = await ctx.new_page()

        await login(page)

        # Fetch raw list to get article IDs
        raw_list = await fetch_raw_list(page)

        # Build slug → id map from raw API
        id_map: dict[str, str | int] = {}
        for raw in raw_list:
            art_id = raw.get("id") or raw.get("news_id") or raw.get("ID")
            title  = raw.get("title") or raw.get("name") or ""
            slug   = raw.get("slug") or slugify(title)
            if art_id and slug:
                id_map[slug] = art_id

        print(f"\nID map built: {len(id_map)} entries")
        print(f"Sample IDs: {list(id_map.items())[:3]}")

        # For each article, fetch its detail
        updated = 0
        for i, article in enumerate(articles, 1):
            slug   = article.get("slug", "")
            art_id = id_map.get(slug)

            if not art_id:
                # Try partial slug match
                for map_slug, mid in id_map.items():
                    if slug[:30] == map_slug[:30]:
                        art_id = mid
                        break

            if not art_id:
                print(f"  [{i}/{len(articles)}] No ID for: {slug[:50]} — skipping")
                continue

            print(f"  [{i}/{len(articles)}] Fetching detail for ID={art_id}: {article['title'][:50]}")
            detail = await fetch_article_detail(page, art_id)

            if detail:
                article.update({k: v for k, v in detail.items() if v})
                updated += 1
                print(f"    Got: {list(detail.keys())}")
            else:
                print(f"    No detail found")

            time.sleep(DELAY)

        await browser.close()

    print(f"\nUpdated {updated}/{len(articles)} articles with detail content")

    with open(NEWS_JSON, "w", encoding="utf-8") as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)
    print(f"Saved to {NEWS_JSON}")
    print("\nNext: run python supabase/import-news.py")


if __name__ == "__main__":
    asyncio.run(main())
