import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CACHE_TABLES, revalidatePublicTables } from "@/lib/cache-tags";

// ── Cache revalidation webhook ───────────────────────────────────────────────
// Target for a Supabase Database Webhook (Dashboard → Database → Webhooks) on
// each public table. It busts the cache tag for the changed table so cached
// public pages refresh — and because it fires on ANY row change, it catches the
// writes the app can't revalidate itself: the `scripts/` importers, Python
// loaders, and admins editing rows directly in the Supabase table editor.
//
// Setup (see supabase/migrations/*_public_cache_revalidation_webhook.sql):
//   • Set REVALIDATE_SECRET in the environment (Vercel + .env.local).
//   • Create one webhook per table in CACHE_TABLES, POSTing here with header
//     Authorization: Bearer <REVALIDATE_SECRET>, on INSERT/UPDATE/DELETE.
//
// This route is intentionally NOT under /api/admin, so it isn't gated by the
// admin auth middleware — it authenticates with the shared secret instead.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return false;
  const header =
    req.headers.get("authorization") ?? req.headers.get("x-revalidate-secret") ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  return token.length > 0 && token === secret;
}

export async function POST(req: NextRequest) {
  if (!process.env.REVALIDATE_SECRET) {
    return NextResponse.json(
      { error: "REVALIDATE_SECRET is not configured on the server." },
      { status: 500 },
    );
  }
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    /* empty/invalid body → nothing to revalidate */
  }

  const b = (body ?? {}) as { table?: unknown; tables?: unknown };
  // Supabase webhook payload is { type, table, schema, record, old_record }.
  // Also accept { tables: [...] } for manual/testing calls.
  const requested: string[] = Array.isArray(b.tables)
    ? (b.tables as unknown[]).filter((t): t is string => typeof t === "string")
    : typeof b.table === "string"
      ? [b.table]
      : [];

  const known = requested.filter((t) => (CACHE_TABLES as readonly string[]).includes(t));
  revalidatePublicTables(known);

  return NextResponse.json({
    ok: true,
    revalidated: known,
    ignored: requested.filter((t) => !known.includes(t)),
  });
}
