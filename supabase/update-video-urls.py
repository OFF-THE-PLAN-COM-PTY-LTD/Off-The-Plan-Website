"""
Directly update developments.video_url for listings with known YouTube videos.
Run from project root: python supabase/update-video-urls.py
"""

import re
import urllib.parse
import httpx

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

# slug → YouTube video ID (confirmed)
VIDEOS = {
    "veue-norwest":             "NWYgRNpDzkc",
    "serai":                    "Gkd4dRkCeHU",
    "lumiere-south-perth":      "0t12o_J-hQg",
    "yarrabee-katoomba":        "hlLLpBNjmM4",
    "kew-tallawong":            "nnIISkQ3fjg",
    "nautique-rushcutters-bay": "MFTjLO0es2Q",
    "mason-main":               "jMmOELY2qdo",
    "adorn":                    "7Tgz5jc8oqI",
    "riva-como":                "pLG_erUW4oA",
    "ellis-residences":         "efZzorsCWL8",
    "avra":                     "OM5fo7aAObc",
    "margaux":                  "B9cTa4AT7_E",
    "carrington-place":         "6wal0-dtJjs",
    "greenwich-chevron-island": "e31F92J0B6Y",
    "bella-vie":                "QWK9ZMXuvzg",
}

def main():
    success = 0
    failed = 0

    with httpx.Client() as client:
        for slug, vid_id in VIDEOS.items():
            video_url = f"https://www.youtube.com/watch?v={vid_id}"
            url = f"{SUPABASE_URL}/rest/v1/developments?slug=eq.{urllib.parse.quote(slug)}"
            res = client.patch(url, json={"video_url": video_url}, headers=REST_HEADERS, timeout=15)
            if res.status_code in (200, 204):
                print(f"OK    {slug}")
                success += 1
            else:
                print(f"FAIL  {slug}  ({res.status_code}: {res.text[:100]})")
                failed += 1

    print(f"\nDone: {success} updated, {failed} failed")

if __name__ == "__main__":
    main()
