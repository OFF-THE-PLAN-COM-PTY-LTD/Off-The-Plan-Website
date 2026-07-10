import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireMemberOrAdmin } from "@/lib/supabase/auth-guards";

/**
 * POST /api/admin/upload/sign
 * Body: { bucket: string, fileName: string, ext: string }
 *
 * Returns a signed upload URL + token so the browser can PUT the file
 * directly to Supabase Storage, bypassing this app's own API route.
 *
 * Why this exists: Vercel serverless functions cap request bodies at
 * ~4.5 MB. The original /api/admin/upload route proxied the whole file
 * through our own API, so any hero video over that size failed with a
 * generic "Upload failed" — Vercel rejected it before our code ever ran.
 * Supabase Storage's own per-file limit is far higher (GBs), so signing
 * a direct-upload URL here and returning it lets the browser upload large
 * files without touching Vercel's body-size ceiling.
 *
 * Only returns a signed URL — the actual bytes never pass through this
 * endpoint. Same bucket/extension allowlist as the classic route so we
 * don't open up arbitrary bucket writes.
 */

const ALLOWED_BUCKETS = new Set([
  "development-images",
  "journal-images",
  "homepage-banners",
  "ads",
  "brochures",
]);

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "pdf", "mp4", "webm", "mov"]);

export async function POST(request: Request) {
  const auth = await requireMemberOrAdmin();
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { bucket, ext } = (body ?? {}) as { bucket?: string; ext?: string };

  if (!bucket || !ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: "Invalid upload destination" }, { status: 400 });
  }
  const cleanExt = (ext ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!cleanExt || !ALLOWED_EXTENSIONS.has(cleanExt)) {
    return NextResponse.json({ error: "File type not allowed." }, { status: 400 });
  }

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${cleanExt}`;

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUploadUrl(fileName);

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not create signed upload URL" }, { status: 500 });
  }

  const { data: { publicUrl } } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path,
    publicUrl,
  });
}
