import { NextResponse } from "next/server";

/**
 * Standard response envelope helpers: { ok: true, data } / { ok: false, error }.
 *
 * ADOPTION RULE: do NOT retrofit an existing route onto these helpers on its
 * own — that changes the route's response body shape and silently breaks its
 * callers. Adopt per-route only, updating that route's client(s) in the SAME
 * commit. New routes may use them freely.
 */

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(error: string, status: number, details?: unknown) {
  return NextResponse.json(
    { ok: false, error, ...(details ? { details } : {}) },
    { status }
  );
}
