"""
Off The Plan — All Agencies scraper
=====================================
Logs into the old admin panel and scrapes all agencies.

Strategy:
  1. Launch Playwright, log in, navigate to All Agencies.
  2. Intercept any XHR/fetch calls — if a JSON API endpoint exists, capture
     all pages from it (fast path).
  3. If no API is found, fall back to scraping the rendered HTML table page
     by page.
  4. Write scraped_agencies/agencies.json ready for import-agencies.py.

Requirements:
    pip install playwright beautifulsoup4
    playwright install chromium

.env.local keys used:
    OLD_ADMIN_URL        Full URL of the All Agencies admin page
    OLD_ADMIN_EMAIL      Admin login email
    OLD_ADMIN_PASSWORD   Admin login password

Usage:
    python supabase/scrape-agencies.py
"""

from __future__ import annotations

import asyncio
import json
import os
import re
import time
from pathlib import Path

from bs4 import BeautifulSoup
from playwright.async_api import async_playwright, Page, Route

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
ADMIN_URL = env.get("OLD_ADMIN_URL", "").rstrip("/")
ADMIN_EMAIL = env.get("OLD_ADMIN_EMAIL", "")
ADMIN_PASSWORD = env.get("OLD_ADMIN_PASSWORD", "")

if not ADMIN_URL or not ADMIN_EMAIL or not ADMIN_PASSWORD:
    raise SystemExit(
        "ERROR: Missing OLD_ADMIN_URL, OLD_ADMIN_EMAIL, or OLD_ADMIN_PASSWORD in .env.local"
    )

OUTPUT_DIR = Path("scraped_agencies")
OUTPUT_FILE = OUTPUT_DIR / "agencies.json"
DELAY = 0.8


# ── API intercept ─────────────────────────────────────────────────────────────

intercepted_api_calls: list[dict] = []


async def capture_response(response) -> None:
    url = response.url
    ct = response.headers.get("content-type", "")
    if "json" in ct and any(kw in url.lower() for kw in ["agenc", "user", "portal", "admin"]):
        try:
            body = await response.json()
            intercepted_api_calls.append({"url": url, "body": body})
            print(f"  [API] Captured: {url}")
        except Exception:
            pass


# ── Login ─────────────────────────────────────────────────────────────────────

async def login(page: Page) -> bool:
    """
    Attempt to log in. Tries common form selectors; returns True on success.
    """
    print(f"Navigating to {ADMIN_URL} ...")
    await page.goto(ADMIN_URL, wait_until="networkidle", timeout=30000)
    await page.wait_for_timeout(2000)

    current = page.url
    print(f"  Landed at: {current}")

    # If redirected to a login page, fill credentials
    if any(kw in current.lower() for kw in ["login", "signin", "auth", "sign-in"]):
        print("  Login page detected — filling credentials ...")
        await _fill_login(page)
        await page.wait_for_timeout(3000)
        await page.wait_for_load_state("networkidle")
        print(f"  After login: {page.url}")

    # Check if we're now on an authenticated page
    if any(kw in page.url.lower() for kw in ["login", "signin", "auth", "sign-in"]):
        # Still on login page — try to look for login form on the same page
        print("  Still on login — trying form on current page ...")
        await _fill_login(page)
        await page.wait_for_timeout(3000)
        await page.wait_for_load_state("networkidle")

    # Navigate to the agencies page
    await page.goto(ADMIN_URL, wait_until="networkidle", timeout=30000)
    await page.wait_for_timeout(2000)
    print(f"  Final URL: {page.url}")
    return True


async def _fill_login(page: Page) -> None:
    email_selectors = [
        'input[type="email"]',
        'input[name="email"]',
        'input[placeholder*="email" i]',
        'input[id*="email" i]',
        'input[name="username"]',
    ]
    password_selectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input[placeholder*="password" i]',
    ]
    submit_selectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Login")',
        'button:has-text("Sign in")',
        'button:has-text("Log in")',
    ]

    for sel in email_selectors:
        if await page.locator(sel).count() > 0:
            await page.fill(sel, ADMIN_EMAIL)
            print(f"    Filled email via: {sel}")
            break

    for sel in password_selectors:
        if await page.locator(sel).count() > 0:
            await page.fill(sel, ADMIN_PASSWORD)
            print(f"    Filled password via: {sel}")
            break

    for sel in submit_selectors:
        if await page.locator(sel).count() > 0:
            await page.click(sel)
            print(f"    Clicked submit via: {sel}")
            return

    # Last resort: press Enter
    await page.keyboard.press("Enter")


# ── HTML table scraper ────────────────────────────────────────────────────────

def parse_agency_row(row) -> dict | None:
    cells = row.find_all("td")
    if len(cells) < 2:
        return None

    # Details cell usually contains Name/Email/Org/Mobile stacked
    details_cell = None
    for cell in cells:
        text = cell.get_text(" ", strip=True)
        if "email:" in text.lower() or "name:" in text.lower():
            details_cell = cell
            break
    if details_cell is None and len(cells) >= 2:
        details_cell = cells[1]

    text = details_cell.get_text("\n", strip=True) if details_cell else ""
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    def extract(label: str) -> str:
        for line in lines:
            if line.lower().startswith(label.lower()):
                return line[len(label):].strip().lstrip(":").strip()
        return ""

    name = extract("Name:") or extract("Name")
    email_raw = details_cell.find("a", href=lambda h: h and "mailto:" in h) if details_cell else None
    email = email_raw.get_text(strip=True) if email_raw else extract("Email:")
    org_link = details_cell.find("a") if details_cell else None
    org_name = org_link.get_text(strip=True) if org_link and "mailto:" not in (org_link.get("href") or "") else extract("Org. Name:")
    mobile = extract("Mobile:")

    # Total active listings
    total_listings = 0
    for cell in cells:
        t = cell.get_text(strip=True)
        if t.isdigit():
            total_listings = int(t)
            break

    # Email verified badge
    email_verified = False
    for cell in cells:
        badge = cell.find(string=re.compile(r"verified", re.I))
        if badge:
            parent = badge.parent if hasattr(badge, "parent") else None
            classes = parent.get("class", []) if parent else []
            cls_str = " ".join(classes).lower()
            # "Not Verified" badge is usually red; "Verified" is green
            if "verified" in badge.lower() and "not" not in badge.lower():
                email_verified = True
            break

    # Portal status
    portal_status = "active"
    for cell in cells:
        badge = cell.find(string=re.compile(r"active|inactive", re.I))
        if badge:
            portal_status = "inactive" if "inactive" in badge.lower() else "active"
            break

    if not name and not email:
        return None

    return {
        "name": name or None,
        "email": email or None,
        "org_name": org_name or None,
        "mobile": mobile or None,
        "total_active_listings": total_listings,
        "email_verified": email_verified,
        "portal_status": portal_status,
    }


async def scrape_html_table(page: Page) -> list[dict]:
    agencies: list[dict] = []
    page_num = 1

    while True:
        print(f"  Scraping page {page_num} ...")
        await page.wait_for_timeout(1500)
        html = await page.content()
        soup = BeautifulSoup(html, "html.parser")

        table = soup.find("table")
        if not table:
            print("  No table found on this page — stopping.")
            break

        rows = table.find_all("tr")[1:]  # skip header
        if not rows:
            print("  No rows — stopping.")
            break

        batch_count = 0
        for row in rows:
            agency = parse_agency_row(row)
            if agency:
                agencies.append(agency)
                batch_count += 1

        print(f"  Found {batch_count} agencies on page {page_num}")

        # Look for a "next page" link or button
        next_btn = None
        for sel in [
            "a:has-text('Next')",
            "a[rel='next']",
            "button:has-text('Next')",
            ".pagination a:last-child",
            "li.next a",
        ]:
            loc = page.locator(sel)
            if await loc.count() > 0:
                is_disabled = await loc.first.get_attribute("disabled")
                aria = await loc.first.get_attribute("aria-disabled")
                if is_disabled is None and aria != "true":
                    next_btn = loc.first
                    break

        if not next_btn:
            print("  No next page — done.")
            break

        await next_btn.click()
        await page.wait_for_load_state("networkidle")
        page_num += 1
        await asyncio.sleep(DELAY)

    return agencies


# ── API path ──────────────────────────────────────────────────────────────────

def extract_from_api(calls: list[dict]) -> list[dict] | None:
    """
    If we captured a useful JSON API response, extract agency records from it.
    Returns None if nothing useful was captured.
    """
    for call in calls:
        body = call["body"]
        candidates = []

        if isinstance(body, list):
            candidates = body
        elif isinstance(body, dict):
            # Debug: print top-level keys so we can see the structure
            print(f"  [API] Response keys: {list(body.keys())}")

            # Try any value that is a non-empty list of dicts
            for key, val in body.items():
                if isinstance(val, list) and val and isinstance(val[0], dict):
                    candidates = val
                    print(f"  [API] Found list under key '{key}' ({len(val)} items)")
                    break
                # Paginated envelope: key -> {data: [...], last_page: N}
                if isinstance(val, dict):
                    inner = val.get("data")
                    if isinstance(inner, list) and inner and isinstance(inner[0], dict):
                        candidates = inner
                        print(f"  [API] Found paginated list under '{key}.data' ({len(inner)} items)")
                        break

        if candidates and isinstance(candidates[0], dict):
            first = candidates[0]
            print(f"  [API] First record keys: {list(first.keys())}")
            # Accept if it has any field that looks like contact/user data
            if any(k in first for k in ["email", "name", "org", "mobile", "phone", "id", "user_id"]):
                print(f"  [API] Using data from {call['url']} — {len(candidates)} records")
                return candidates

    return None


def normalise_api_agency(raw: dict) -> dict:
    """Map raw API fields (all_agency endpoint) to our schema."""
    # Name: API returns first_name + last_name separately
    first = (raw.get("first_name") or "").strip()
    last = (raw.get("last_name") or "").strip()
    name = f"{first} {last}".strip() or raw.get("name") or raw.get("full_name") or None

    email = raw.get("email") or raw.get("org_email") or None
    org_name = raw.get("org_name") or None
    mobile = raw.get("mobile") or raw.get("org_phone") or raw.get("phone") or None

    # Total active listings: API has a 'listing' field (list or count)
    listing_raw = raw.get("listing")
    if isinstance(listing_raw, list):
        total = len(listing_raw)
    elif isinstance(listing_raw, (int, float)):
        total = int(listing_raw)
    else:
        total = int(raw.get("total_active_listings") or raw.get("active_listings") or 0)

    # Email verified: API uses is_email_verified (0/1 or bool)
    verified_raw = raw.get("is_email_verified") or raw.get("email_verified") or raw.get("verified") or False
    if isinstance(verified_raw, bool):
        email_verified = verified_raw
    elif isinstance(verified_raw, str):
        email_verified = verified_raw.lower() in ("1", "true", "yes")
    else:
        email_verified = bool(verified_raw)

    # Portal status: use is_agency flag — 1 = active portal user
    is_agency = raw.get("is_agency")
    status_raw = (raw.get("portal_status") or raw.get("status") or "").lower()
    if "inactive" in status_raw or status_raw == "0":
        portal_status = "inactive"
    elif is_agency is not None:
        portal_status = "active" if bool(is_agency) else "inactive"
    else:
        portal_status = "active"

    legacy_id = str(raw.get("id") or raw.get("user_id") or "")

    return {
        "name": name,
        "email": email,
        "org_name": org_name,
        "mobile": mobile,
        "total_active_listings": total,
        "email_verified": email_verified,
        "portal_status": portal_status,
        "legacy_id": legacy_id or None,
    }


# ── Main ───────────────────────────────────────────────────────────────────────

async def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)  # visible so you can see/debug login
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
        )
        page = await context.new_page()

        # Intercept JSON responses to catch any API calls
        page.on("response", capture_response)

        await login(page)

        # Give time for any background API calls to complete
        await page.wait_for_timeout(3000)

        # --- Try API path first ---
        agencies: list[dict] = []

        api_records = extract_from_api(intercepted_api_calls)
        if api_records:
            print(f"\nAPI path: extracting {len(api_records)} records ...")
            agencies = [normalise_api_agency(r) for r in api_records]

            # Check for pagination in the API
            for call in intercepted_api_calls:
                body = call["body"]
                if isinstance(body, dict):
                    for key in ["agencies", "users"]:
                        nested = body.get(key, {})
                        if isinstance(nested, dict):
                            last_page = nested.get("last_page") or 1
                            if int(last_page) > 1:
                                print(f"  API has {last_page} pages — fetching remaining ...")
                                # TODO: add multi-page API scraping if needed
                            break
        else:
            print("\nNo API captured — falling back to HTML scraper ...")
            agencies = await scrape_html_table(page)

        await browser.close()

    if not agencies:
        print("\n✗ No agencies found — check login or page structure.")
        return

    # Deduplicate by email
    seen: set[str] = set()
    unique: list[dict] = []
    for a in agencies:
        key = (a.get("email") or "").lower() or str(a)
        if key not in seen:
            seen.add(key)
            unique.append(a)

    print(f"\nTotal unique agencies: {len(unique)}")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(unique, f, indent=2, ensure_ascii=False)

    print(f"Saved to {OUTPUT_FILE}")
    print("\nNext step:")
    print("  python supabase/import-agencies.py")


if __name__ == "__main__":
    asyncio.run(main())
