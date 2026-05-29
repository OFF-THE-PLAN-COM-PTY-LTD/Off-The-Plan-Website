import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireMemberOrAdmin } from "@/lib/supabase/auth-guards";

export async function POST(request: Request) {
  const auth = await requireMemberOrAdmin();
  if ("error" in auth) return auth.error;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const requested = (formData.get("bucket") as string) ?? "development-images";

  const ALLOWED_BUCKETS = new Set([
    "development-images",
    "journal-images",
    "homepage-banners",
    "ads",
    "brochures",
  ]);
  if (!ALLOWED_BUCKETS.has(requested)) {
    return NextResponse.json({ error: "Invalid upload destination" }, { status: 400 });
  }
  const bucket = requested;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const allowedTypes = ["jpg", "jpeg", "png", "webp", "gif", "pdf", "mp4", "webm", "mov"];
  if (!allowedTypes.includes(ext)) {
    return NextResponse.json({ error: "File type not allowed. Use JPG, PNG, WebP, PDF, MP4 or WebM." }, { status: 400 });
  }

  // Validate the actual MIME type, not just the filename extension — anyone
  // can rename evil.exe to evil.png. Different buckets accept different
  // content types: image-bearing buckets allow image/*, the brochures bucket
  // also allows application/pdf, and the homepage-banners bucket additionally
  // accepts video files for the hero player.
  const mime = (file.type || "").toLowerCase();
  const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
  const VIDEO_MIMES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
  const PDF_MIME = "application/pdf";

  const allowsVideo = bucket === "homepage-banners";
  const allowsPdf = bucket === "brochures";

  const mimeOk =
    IMAGE_MIMES.has(mime) ||
    (allowsVideo && VIDEO_MIMES.has(mime)) ||
    (allowsPdf && mime === PDF_MIME);

  if (!mimeOk) {
    const allowedDesc = allowsVideo
      ? "image or video"
      : allowsPdf
      ? "image or PDF"
      : "image";
    return NextResponse.json(
      { error: `Only ${allowedDesc} files are allowed for this upload.` },
      { status: 400 },
    );
  }

  // Image / PDF files capped at 10 MB; videos can be substantially larger.
  const isVideo = VIDEO_MIMES.has(mime);
  const maxBytes = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    const limit = isVideo ? "100 MB" : "10 MB";
    return NextResponse.json({ error: `File too large. Maximum size is ${limit}.` }, { status: 400 });
  }

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return NextResponse.json({ url: publicUrl });
}
