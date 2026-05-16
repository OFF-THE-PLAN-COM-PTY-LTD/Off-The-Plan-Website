"""
Off The Plan — Fast news body fetcher (no browser, uses API + session cookie)
=============================================================================
1. Logs in via HTTP to get a session cookie
2. Re-fetches the raw list API to get article IDs
3. For each ID tries several detail API patterns
4. Updates scraped_news/news.json in-place

Requirements:
    pip install httpx beautifulsoup4

Usage:
    python supabase/fetch-news-body-fast.py
"""

from __future__ import annotations

import json
import re
import time
from pathlib import Path

import httpx
from bs4 import BeautifulSoup

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
ADMIN_BASE  = env.get("OLD_ADMIN_URL", "").rstrip("/")   # e.g. https://offtheplan.com.au/all_agency
ADMIN_EMAIL = env.get("OLD_ADMIN_EMAIL", "")
ADMIN_PASS  = env.get("OLD_ADMIN_PASSWORD", "")
SITE_BASE   = "https://offtheplan.com.au"

NEWS_JSON   = Path("scraped_news/news.json")
LIST_API    = f"{SITE_BASE}/api/manage_news_and_events_list/get_all_data"
DELAY       = 0.25


def slugify(title: str) -> str:
    s = title.lower().strip()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s)
    return re.sub(r"-+", "-", s)[:200]


# ── Login + get session ───────────────────────────────────────────────────────

def get_session(client: httpx.Client) -> bool:
    """Try to authenticate and get a session cookie."""
    # First load the login page to get any CSRF token
    login_url = f"{SITE_BASE}/all_agency"
    r = client.get(login_url, timeout=15, follow_redirects=True)

    # Try to find login form action and CSRF token
    soup = BeautifulSoup(r.text, "html.parser")
    form = soup.find("form")
    csrf_token = ""
    if form:
        csrf_input = form.find("input", {"name": re.compile(r"csrf|token|_token", re.I)})
        if csrf_input:
            csrf_token = csrf_input.get("value", "")
        form_action = form.get("action", login_url)
    else:
        form_action = login_url

    payload = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASS,
    }
    if csrf_token:
        payload["_token"] = csrf_token

    r2 = client.post(form_action, data=payload, timeout=15, follow_redirects=True)
    print(f"  Login response: {r2.status_code} — now at {r2.url}")
    return r2.status_code < 400


# ── Fetch raw list to get IDs ─────────────────────────────────────────────────

def fetch_raw_list(client: httpx.Client) -> list[dict]:
    try:
        r = client.get(LIST_API, timeout=20, follow_redirects=True,
                       headers={"Accept": "application/json", "X-Requested-With": "XMLHttpRequest"})
        if r.status_code == 200:
            data = r.json()
            items = data if isinstance(data, list) else []
            if not items and isinstance(data, dict):
                for v in data.values():
                    if isinstance(v, list) and v:
                        items = v; break
            print(f"  Raw list: {len(items)} items")
            return items
    except Exception as e:
        print(f"  List API error: {e}")
    return []


# ── Try detail API patterns ───────────────────────────────────────────────────

DETAIL_PATTERNS = [
    "/api/manage_news_and_events_list/get_news_detail/{id}",
    "/api/manage_news_and_events_list/get_detail/{id}",
    "/api/manage_news_and_events_list/news_detail/{id}",
    "/api/manage_news_and_events_list/get_data/{id}",
    "/api/manage_news_and_events_list/get_news/{id}",
    "/api/manage_news_and_events_list/detail/{id}",
    "/api/news/get_detail/{id}",
    "/api/news/detail/{id}",
]

def fetch_detail_api(client: httpx.Client, article_id) -> dict | None:
    headers = {"Accept": "application/json", "X-Requested-With": "XMLHttpRequest"}
    for pattern in DETAIL_PATTERNS:
        url = SITE_BASE + pattern.replace("{id}", str(article_id))
        try:
            r = client.get(url, timeout=10, follow_redirects=True, headers=headers)
            if r.status_code == 200:
                try:
                    data = r.json()
                    if isinstance(data, dict) and any(k in data for k in ["title", "body", "content", "body_html"]):
                        print(f"    Detail API hit: {url}")
                        return data
                    if isinstance(data, list) and data:
                        return data[0]
                except Exception:
                    pass
        except Exception:
            pass
    return None


# ── Try scraping public article page ─────────────────────────────────────────

PUBLIC_URL_PATTERNS = [
    "/news-and-events/{slug}",
    "/news/{slug}",
    "/manage_news_and_events_list/{slug}",
    "/blog/{slug}",
    "/articles/{slug}",
]

def fetch_public_page(client: httpx.Client, slug: str) -> dict:
    for pattern in PUBLIC_URL_PATTERNS:
        url = SITE_BASE + pattern.replace("{slug}", slug)
        try:
            r = client.get(url, timeout=10, follow_redirects=True)
            if r.status_code == 200 and len(r.text) > 500:
                soup = BeautifulSoup(r.text, "html.parser")
                page_title = soup.title.string if soup.title else ""
                if "404" in page_title or "not found" in page_title.lower():
                    continue

                result: dict = {}

                # Body: look for article main content
                for sel in ["article", ".article-content", ".news-content",
                            ".post-content", ".entry-content", "main"]:
                    el = soup.select_one(sel)
                    if el:
                        # Remove nav/header/footer noise
                        for tag in el.select("nav, header, footer, script, style"):
                            tag.decompose()
                        body = el.decode_contents().strip()
                        if len(body) > 100:
                            result["body_html"] = body
                            break

                # Hero image
                og_img = soup.find("meta", property="og:image")
                if og_img and og_img.get("content"):
                    result["hero_image_url"] = og_img["content"]

                # Subtitle / description
                og_desc = soup.find("meta", property="og:description") or \
                          soup.find("meta", {"name": "description"})
                if og_desc and og_desc.get("content"):
                    result["subtitle"] = og_desc["content"][:500]

                if result:
                    print(f"    Public page hit: {url} — fields: {list(result.keys())}")
                    return result
        except Exception:
            pass
    return {}


def normalise_detail(raw: dict) -> dict:
    """Extract fields from a detail API response."""
    result: dict = {}
    field_map = {
        "body_html": ["body_html", "body", "content", "description", "news_content"],
        "subtitle":  ["subtitle", "sub_title", "short_description", "excerpt"],
        "hero_image_url": ["hero_image_url", "image", "thumbnail", "featured_image", "main_image"],
        "meta_title":   ["meta_title", "seo_title"],
        "meta_content": ["meta_content", "meta_description", "seo_description"],
    }
    for dest, sources in field_map.items():
        for src in sources:
            if raw.get(src):
                result[dest] = raw[src]
                break
    return result


# ── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    if not NEWS_JSON.exists():
        raise SystemExit(f"Not found: {NEWS_JSON} — run scrape-news.py first.")

    with open(NEWS_JSON, encoding="utf-8") as f:
        articles: list[dict] = json.load(f)

    print(f"Loaded {len(articles)} articles")

    with httpx.Client(follow_redirects=True, timeout=15) as client:
        print("\nLogging in ...")
        get_session(client)

        print("\nFetching raw list for IDs ...")
        raw_list = fetch_raw_list(client)

        # Build slug → id and slug → raw_data maps
        id_map:  dict[str, int | str] = {}
        raw_map: dict[str, dict]       = {}
        for raw in raw_list:
            art_id = raw.get("id") or raw.get("news_id") or raw.get("ID")
            title  = raw.get("title") or raw.get("name") or ""
            slug   = raw.get("slug") or slugify(title)
            if slug:
                if art_id:
                    id_map[slug]  = art_id
                raw_map[slug] = raw

        # Check if the raw API already has body content
        sample = raw_list[0] if raw_list else {}
        print(f"\nRaw API fields: {list(sample.keys())}")
        has_body = any(raw_list[0].get(k) for k in ["body", "body_html", "content", "description"]) if raw_list else False
        print(f"Body in raw list API: {has_body}")

        updated = 0
        for i, article in enumerate(articles, 1):
            slug = article.get("slug", "")

            # Already has content? Skip.
            if article.get("body_html"):
                print(f"  [{i}/{len(articles)}] Already has content — skip")
                continue

            art_id = id_map.get(slug)
            # Try partial match
            if not art_id:
                for ms, mid in id_map.items():
                    if slug[:40] == ms[:40]:
                        art_id = mid; break

            # Use raw_map data if it has body
            raw = raw_map.get(slug, {})
            detail = normalise_detail(raw)

            if not detail.get("body_html") and art_id:
                print(f"  [{i}/{len(articles)}] Trying detail API for ID={art_id}: {article['title'][:50]}")
                api_data = fetch_detail_api(client, art_id)
                if api_data:
                    detail = normalise_detail(api_data)

            if not detail.get("body_html"):
                print(f"  [{i}/{len(articles)}] Trying public page: {slug[:50]}")
                detail = fetch_public_page(client, slug)

            if detail:
                article.update({k: v for k, v in detail.items() if v and not article.get(k)})
                updated += 1
                print(f"    Fields added: {list(detail.keys())}")
            else:
                print(f"  [{i}/{len(articles)}] Nothing found for: {slug[:50]}")

            time.sleep(DELAY)

    print(f"\nUpdated {updated}/{len(articles)} articles")

    with open(NEWS_JSON, "w", encoding="utf-8") as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)
    print(f"Saved → {NEWS_JSON}")
    print("\nNext: python supabase/import-news.py")


if __name__ == "__main__":
    main()
