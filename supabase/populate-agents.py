"""
Populate agent_name, agent_phone, agent_email in developments
from selling_agents in each listing's scraped JSON.

Usage:
    python supabase/populate-agents.py
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
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            m = re.match(r'^([A-Z0-9_]+)\s*=\s*(.*)$', line)
            if m:
                env[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    return env

env = read_env(".env.local")
SUPABASE_URL = env.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
SERVICE_ROLE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
LISTINGS_DIR = Path("Off plan 2")

HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}


def main():
    with httpx.Client() as client:
        updated = 0
        skipped = 0

        for json_path in sorted(LISTINGS_DIR.rglob("*.json")):
            try:
                data = json.load(open(json_path, encoding="utf-8", errors="replace"))
            except Exception:
                continue

            slug = data.get("project_overview", {}).get("slug", "")
            if not slug:
                continue

            agents = data.get("selling_agents", [])
            if not agents:
                skipped += 1
                continue

            # Pick the first agent that has a name; prefer ones with a phone number
            agent = next((a for a in agents if a.get("name") and a.get("mobile")), None)
            if not agent:
                agent = next((a for a in agents if a.get("name")), None)
            if not agent:
                skipped += 1
                continue

            agent_name = agent.get("name") or None
            agent_phone = agent.get("mobile") or None
            agent_email = agent.get("email") or None

            # Skip placeholder emails from CRM systems
            if agent_email and "@in.propertybase.com" in agent_email:
                agent_email = None
            # If second agent has a real email, prefer it
            if len(agents) > 1:
                for a in agents[1:]:
                    e = a.get("email", "")
                    if e and "@in.propertybase.com" not in e:
                        agent_email = e
                        break

            res = client.patch(
                f"{SUPABASE_URL}/rest/v1/developments?slug=eq.{urllib.parse.quote(slug)}",
                json={"agent_name": agent_name, "agent_phone": agent_phone, "agent_email": agent_email},
                headers=HEADERS,
                timeout=15,
            )

            if res.status_code in (200, 204):
                print(f"OK  {slug[:55]}")
                print(f"    {agent_name} | {agent_phone} | {agent_email}")
                updated += 1
            else:
                print(f"FAIL {slug}: {res.status_code} {res.text[:100]}")
                skipped += 1

        print(f"\nDone: {updated} updated, {skipped} skipped")


if __name__ == "__main__":
    main()
