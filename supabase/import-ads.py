"""
Import the 8 ads from scraped_ads.json into Supabase.

Maps old admin field names to our schema:
  page              page          (listing_list -> listings)
  ad_position       position
  type='imgUpload'  ad_type='image'
  desk_path         desktop_image_url
  mob_path          mobile_image_url
  desk_web_link     web_link
  is_active 0/1     is_active

Usage:
    python supabase/import-ads.py
"""

from __future__ import annotations
import json, re, sys
from pathlib import Path
import httpx

sys.stdout.reconfigure(encoding="utf-8")


def read_env(path: str) -> dict[str, str]:
    env = {}
    with open(path, encoding="utf-8") as f:
        for raw in f:
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            m = re.match(r"^([A-Za-z0-9_]+)\s*=\s*(.*)$", line)
            if m:
                env[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    return env


PAGE_MAP = {
    "home": "home",
    "listing_list": "listings",
    "listings": "listings",
    "resources": "resources",
    "resource": "resources",
    "news": "news",
    "guides": "guides",
}

POSITION_MAP = {
    "top": "top",
    "middle": "middle",
    "bottom": "bottom",
    "right": "right",
}


def main() -> None:
    src = Path("scraped_ads.json")
    if not src.exists():
        raise SystemExit(f"Not found: {src}")

    with open(src, encoding="utf-8") as f:
        ads = json.load(f)

    env = read_env(".env.local")
    base = env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    key = env["SUPABASE_SERVICE_ROLE_KEY"]
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    inserted = 0
    with httpx.Client(timeout=20) as client:
        # Clear existing ads first so we get a clean import
        client.delete(f"{base}/rest/v1/ads?id=neq.00000000-0000-0000-0000-000000000000", headers=headers)

        for i, ad in enumerate(ads, 1):
            page = PAGE_MAP.get(ad.get("page", "").lower())
            pos = POSITION_MAP.get(ad.get("ad_position", "").lower())
            if not page or not pos:
                print(f"  [{i}] Skip — unmapped page/position: {ad.get('page')}/{ad.get('ad_position')}")
                continue

            row = {
                "page": page,
                "position": pos,
                "ad_type": "image" if ad.get("type", "").lower() in ("imgupload", "image") else "adsense",
                "desktop_image_url": ad.get("desk_path"),
                "mobile_image_url": ad.get("mob_path"),
                "web_link": ad.get("desk_web_link") or ad.get("mob_web_link"),
                "adsense_code": ad.get("adsense_code"),
                "is_active": bool(ad.get("is_active", 1)),
                "sort_order": i,
            }

            r = client.post(f"{base}/rest/v1/ads", headers=headers, json=row)
            if r.status_code in (200, 201, 204):
                inserted += 1
                print(f"  [{i}] OK: {page}/{pos}")
            else:
                print(f"  [{i}] ERR {r.status_code}: {r.text[:200]}")

    print(f"\nDone — {inserted}/{len(ads)} ads imported")


if __name__ == "__main__":
    main()
