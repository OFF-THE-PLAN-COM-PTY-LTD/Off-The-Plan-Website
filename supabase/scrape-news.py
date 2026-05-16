"""
Off The Plan — News & Events scraper
======================================
Logs into the old admin panel, navigates to News and Events, intercepts
any JSON API calls, and falls back to paginated HTML scraping.

For each article it also visits the Edit page to capture the full body HTML.

Requirements:
    pip install playwright beautifulsoup4
    python -m playwright install chromium

.env.local keys used:
    OLD_ADMIN_URL         Full URL of the old admin (e.g. https://admin.offtheplan.com.au)
    OLD_ADMIN_NEWS_URL    Full URL of the News and Events list page (optional override)
    OLD_ADMIN_EMAIL       Admin login email
    OLD_ADMIN_PASSWORD    Admin login password

Output:
    scraped_news/news.json

Usage:
    python supabase/scrape-news.py
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
ADMIN_BASE   = env.get("OLD_ADMIN_URL", "").rstrip("/")
# Strip any trailing path so we get the true base (e.g. /all_agency → keep it)
NEWS_URL     = env.get("OLD_ADMIN_NEWS_URL", "") or f"{ADMIN_BASE}/news-and-events"
ADMIN_EMAIL  = env.get("OLD_ADMIN_EMAIL", "")
ADMIN_PASS   = env.get("OLD_ADMIN_PASSWORD", "")

if not ADMIN_BASE or not ADMIN_EMAIL or not ADMIN_PASS:
    raise SystemExit(
        "ERROR: Missing OLD_ADMIN_URL, OLD_ADMIN_EMAIL, or OLD_ADMIN_PASSWORD in .env.local"
    )

OUTPUT_DIR  = Path("scraped_news")
OUTPUT_FILE = OUTPUT_DIR / "news.json"
DELAY       = 1.0   # seconds between page requests


# ── API intercept ─────────────────────────────────────────────────────────────

intercepted: list[dict] = []

async def capture_response(response) -> None:
    url = response.url
    ct  = response.headers.get("content-type", "")
    # Capture ALL JSON responses so we don't miss an unexpected endpoint name
    if "json" in ct:
        try:
            body = await response.json()
            # Only keep if it looks like it might contain articles (list or dict with list values)
            has_list = isinstance(body, list) or (
                isinstance(body, dict) and any(isinstance(v, list) and len(v) > 0 for v in body.values())
            )
            if has_list:
                intercepted.append({"url": url, "body": body})
                print(f"  [API] Captured: {url}")
        except Exception:
            pass


# ── Login ─────────────────────────────────────────────────────────────────────

async def login(page: Page) -> None:
    print(f"Navigating to {ADMIN_BASE} ...")
    await page.goto(ADMIN_BASE, wait_until="networkidle", timeout=30000)
    await page.wait_for_timeout(2000)

    if any(kw in page.url.lower() for kw in ["login", "signin", "auth", "sign-in"]):
        print("  Login page — filling credentials ...")
        await _fill_login(page)
        await page.wait_for_timeout(3000)
        await page.wait_for_load_state("networkidle")

    print(f"  After login: {page.url}")


async def _fill_login(page: Page) -> None:
    for sel in ['input[type="email"]', 'input[name="email"]', 'input[placeholder*="email" i]']:
        if await page.locator(sel).count() > 0:
            await page.fill(sel, ADMIN_EMAIL); break
    for sel in ['input[type="password"]', 'input[name="password"]']:
        if await page.locator(sel).count() > 0:
            await page.fill(sel, ADMIN_PASS); break
    for sel in ['button[type="submit"]', 'input[type="submit"]',
                'button:has-text("Login")', 'button:has-text("Sign in")']:
        if await page.locator(sel).count() > 0:
            await page.click(sel); return
    await page.keyboard.press("Enter")


# ── HTML scraping ─────────────────────────────────────────────────────────────

def slugify(title: str) -> str:
    s = title.lower().strip()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s[:200]


def parse_news_row(row) -> dict | None:
    cells = row.find_all("td")
    if len(cells) < 3:
        return None

    # First cell with a link = title
    title_cell = cells[0]
    link = title_cell.find("a")
    if not link:
        return None
    title = link.get_text(strip=True)
    href  = link.get("href", "")

    # Extract edit URL — the Edit button is usually a link too
    edit_href = ""
    for cell in cells:
        for a in cell.find_all("a"):
            if "edit" in a.get_text(strip=True).lower() or "edit" in (a.get("href") or "").lower():
                edit_href = a.get("href", "")
                break

    # DateTime — second cell
    date_text = cells[1].get_text(strip=True) if len(cells) > 1 else ""

    # Status — look for PUBLISHED / DRAFT text or badge
    status_text = ""
    for cell in cells:
        t = cell.get_text(strip=True).upper()
        if "PUBLISHED" in t or "DRAFT" in t:
            status_text = t
            break

    is_published = "PUBLISHED" in status_text and "UNPUBLISH" not in status_text.upper()

    # Parse date
    published_at = None
    if date_text:
        try:
            # Format like "15-05-2026 15:17:46"
            from datetime import datetime
            for fmt in ["%d-%m-%Y %H:%M:%S", "%Y-%m-%d %H:%M:%S", "%d/%m/%Y %H:%M:%S"]:
                try:
                    dt = datetime.strptime(date_text, fmt)
                    published_at = dt.isoformat()
                    break
                except ValueError:
                    continue
        except Exception:
            pass

    return {
        "title": title,
        "slug": slugify(title),
        "is_published": is_published,
        "published_at": published_at,
        "hero_image_url": None,
        "body_html": None,
        "_edit_href": edit_href,
        "_title_href": href,
    }


async def scrape_article_body(page: Page, base: str, edit_href: str) -> str | None:
    if not edit_href:
        return None
    url = edit_href if edit_href.startswith("http") else base + "/" + edit_href.lstrip("/")
    try:
        await page.goto(url, wait_until="networkidle", timeout=20000)
        await page.wait_for_timeout(800)
        html = await page.content()
        soup = BeautifulSoup(html, "html.parser")

        # Try common rich text / textarea selectors
        for sel in [
            "textarea[name*='body']", "textarea[name*='content']",
            "textarea[name*='description']", ".ql-editor", ".ProseMirror",
            "[contenteditable='true']", "textarea",
        ]:
            el = soup.select_one(sel)
            if el:
                return el.get_text(separator="\n", strip=True) or el.decode_contents()

        # Try to find a hero image on the edit page
        for img_sel in ['img[name*="hero"]', 'img[class*="hero"]', '.hero-preview img']:
            img = soup.select_one(img_sel)
            if img and img.get("src"):
                return None  # return separately if needed
    except Exception as e:
        print(f"    Failed to load edit page: {e}")
    return None


async def scrape_html_pages(page: Page) -> list[dict]:
    articles: list[dict] = []
    page_num = 1

    while True:
        url = f"{NEWS_URL}?page={page_num}" if page_num > 1 else NEWS_URL
        print(f"  Scraping HTML page {page_num}: {url}")
        await page.goto(url, wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2500)  # extra wait for dynamic content
        # Scroll to trigger any lazy loading
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(1000)

        html  = await page.content()
        soup  = BeautifulSoup(html, "html.parser")

        # Try table rows first, then fall back to div/li rows
        rows = soup.select("table tbody tr")
        if not rows:
            # Some admin panels render as div rows
            rows = soup.select("tr")  # any tr
        if not rows:
            print(f"  No table rows on page {page_num}.")
            print(f"  Page title: {soup.title.string if soup.title else 'N/A'}")
            # Dump a snippet to help debug
            body_text = soup.get_text(" ", strip=True)[:300]
            print(f"  Page text snippet: {body_text}")
            break

        page_articles: list[dict] = []
        for row in rows:
            item = parse_news_row(row)
            if item:
                page_articles.append(item)

        if not page_articles:
            print("  No articles parsed — stopping.")
            break

        print(f"    {len(page_articles)} articles on page {page_num}")
        articles.extend(page_articles)

        # Check for a "Next" pagination link
        next_link = soup.find("a", string=re.compile(r"next", re.I))
        if not next_link:
            # Also check for numbered page links beyond current
            page_links = soup.select("a[href*='page=']")
            max_page = page_num
            for pl in page_links:
                m = re.search(r"page=(\d+)", pl.get("href", ""))
                if m:
                    max_page = max(max_page, int(m.group(1)))
            if max_page <= page_num:
                print("  No more pages.")
                break

        page_num += 1
        time.sleep(DELAY)

    return articles


# ── Extract from API ──────────────────────────────────────────────────────────

def extract_from_api(calls: list[dict]) -> list[dict] | None:
    for call in calls:
        body = call["body"]
        candidates = [body] if isinstance(body, list) else []
        if isinstance(body, dict):
            for v in body.values():
                if isinstance(v, list) and len(v) > 0:
                    candidates.append(v)
        for candidate in candidates:
            if not isinstance(candidate, list) or len(candidate) == 0:
                continue
            first = candidate[0]
            if isinstance(first, dict) and any(k in first for k in ["title", "name", "heading"]):
                print(f"  [API] Found {len(candidate)} articles in {call['url']}")
                return candidate
    return None


def normalise_api_article(raw: dict) -> dict:
    title = (raw.get("title") or raw.get("name") or raw.get("heading") or "").strip()
    slug  = raw.get("slug") or slugify(title)

    body  = (raw.get("body") or raw.get("body_html") or raw.get("content")
             or raw.get("description") or raw.get("body_content") or "")

    hero  = (raw.get("hero_image_url") or raw.get("image") or raw.get("thumbnail")
             or raw.get("featured_image") or raw.get("cover_image") or None)

    pub_raw = (raw.get("published_at") or raw.get("created_at")
               or raw.get("date") or raw.get("datetime") or "")
    published_at = pub_raw if pub_raw else None

    status_raw = str(raw.get("status") or raw.get("is_published") or "").lower()
    is_published = status_raw in ("1", "true", "published", "active")

    return {
        "title": title,
        "slug": slug,
        "hero_image_url": hero,
        "body_html": body or None,
        "is_published": is_published,
        "published_at": published_at,
    }


# ── Main ─────────────────────────────────────────────────────────────────────

async def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=False)
        ctx     = await browser.new_context()
        page    = await ctx.new_page()

        page.on("response", capture_response)

        await login(page)

        # ── Try direct API endpoint first (same pattern as agencies) ────────────
        api_base = ADMIN_BASE.replace("/all_agency", "")
        api_candidates = [
            f"{api_base}/api/all_agency/get_all_news",
            f"{api_base}/api/all_agency/get_all_news_details",
            f"{api_base}/api/all_agency/get_all_news_events",
            f"{api_base}/api/news/get_all_news",
            f"{api_base}/api/get_all_news",
        ]

        articles_raw = None
        for api_url in api_candidates:
            print(f"\nTrying API: {api_url}")
            try:
                resp = await page.evaluate(f"""
                    fetch("{api_url}", {{
                        headers: {{
                            "Accept": "application/json",
                            "X-Requested-With": "XMLHttpRequest"
                        }}
                    }}).then(r => r.ok ? r.json() : null).catch(() => null)
                """)
                if resp:
                    print(f"  Got response from {api_url}")
                    intercepted.append({"url": api_url, "body": resp})
                    articles_raw = extract_from_api([{"url": api_url, "body": resp}])
                    if articles_raw:
                        print(f"  Found {len(articles_raw)} articles via API!")
                        break
            except Exception as e:
                print(f"  Failed: {e}")

        if not articles_raw:
            # ── Click "News" in the sidebar navigation ────────────────────────
            print("\nLooking for News and Events in sidebar navigation ...")
            news_link = None
            for selector in [
                'a:has-text("News and Events")',
                'a:has-text("News & Events")',
                'a:has-text("News")',
                'a[href*="news"]',
            ]:
                if await page.locator(selector).count() > 0:
                    news_link = page.locator(selector).first
                    break

            if news_link:
                await news_link.click()
                await page.wait_for_load_state("networkidle")
                await page.wait_for_timeout(3000)
                print(f"  Clicked news link — now at: {page.url}")
            else:
                print(f"  No sidebar link found — going to: {NEWS_URL}")
                await page.goto(NEWS_URL, wait_until="networkidle", timeout=30000)
                await page.wait_for_timeout(3000)
                print(f"  Landed at: {page.url}")

            # Scroll to trigger lazy-loaded API calls
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(2000)
            await page.evaluate("window.scrollTo(0, 0)")
            await page.wait_for_timeout(1000)

            print(f"\n  Intercepted {len(intercepted)} JSON call(s):")
            for c in intercepted:
                print(f"    {c['url']}")

            articles_raw = extract_from_api(intercepted)

        if articles_raw:
            print(f"\nUsing API data — {len(articles_raw)} articles found.")
            articles = [normalise_api_article(a) for a in articles_raw if a.get("title") or a.get("name")]
        else:
            print(f"\nNo API data found — falling back to HTML scraping at: {page.url}")
            raw_articles = await scrape_html_pages(page)

            # Enrich with body content from edit pages
            print(f"\nFetching body content for {len(raw_articles)} articles ...")
            for i, art in enumerate(raw_articles, 1):
                if art.get("_edit_href"):
                    print(f"  [{i}/{len(raw_articles)}] {art['title'][:60]}")
                    body = await scrape_article_body(page, ADMIN_BASE, art["_edit_href"])
                    if body:
                        art["body_html"] = body
                time.sleep(0.5)

            # Strip private fields
            articles = [{k: v for k, v in a.items() if not k.startswith("_")} for a in raw_articles]

        await browser.close()

    # Deduplicate on slug
    seen: set[str] = set()
    unique = []
    for a in articles:
        if a["slug"] not in seen:
            seen.add(a["slug"])
            unique.append(a)

    print(f"\nTotal unique articles: {len(unique)}")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(unique, f, ensure_ascii=False, indent=2)
    print(f"Saved to {OUTPUT_FILE}")
    print("\nNext: run python supabase/import-news.py")


if __name__ == "__main__":
    asyncio.run(main())
