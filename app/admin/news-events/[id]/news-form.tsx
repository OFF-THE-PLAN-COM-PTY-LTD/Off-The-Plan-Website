"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImageUpload } from "@/components/admin/image-upload";

type Article = {
  id: string;
  title: string;
  slug: string;
  hero_image_url: string | null;
  body_html: string | null;
  is_published: boolean;
  published_at: string | null;
};

function slugify(title: string) {
  return title.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface Props {
  id: string;
  existing?: Article;
}

export function NewsForm({ id, existing }: Props) {
  const router = useRouter();
  const isNew = id === "new";

  const [title, setTitle] = useState(existing?.title ?? "");
  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [slugManual, setSlugManual] = useState(!isNew);
  const [heroImageUrl, setHeroImageUrl] = useState(existing?.hero_image_url ?? "");
  const [bodyHtml, setBodyHtml] = useState(existing?.body_html ?? "");
  const [isPublished, setIsPublished] = useState(existing?.is_published ?? false);
  const [publishedAt, setPublishedAt] = useState(
    existing?.published_at ? existing.published_at.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!slugManual) setSlug(slugify(title));
  }, [title, slugManual]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const payload = {
      ...(isNew ? {} : { id }),
      title,
      slug,
      hero_image_url: heroImageUrl || null,
      body_html: bodyHtml || null,
      is_published: isPublished,
      published_at: publishedAt || null,
    };

    const res = await fetch("/api/admin/news", {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(json.error ?? "Failed to save.");
      return;
    }

    setSuccess(true);
    if (isNew) {
      setTimeout(() => router.push("/admin/news-events"), 800);
    }
  }

  return (
    <div>
      <div className="bg-navy flex items-center justify-between px-6 py-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/news-events" className="font-sans text-sm text-white/50 hover:text-white transition-colors">
            ← News & Events
          </Link>
          <span className="text-white/20">/</span>
          <h1 className="font-display font-light text-white text-xl">
            {isNew ? "New Article" : "Edit Article"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Title */}
        <div className="bg-white border border-line p-6">
          <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-ink/50 mb-2">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border border-line px-3 py-2 font-sans text-sm text-ink focus:outline-none focus:border-orange"
            placeholder="Article title…"
          />

          <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-ink/50 mt-4 mb-2">Slug *</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
            required
            className="w-full border border-line px-3 py-2 font-mono text-sm text-ink focus:outline-none focus:border-orange"
          />
        </div>

        {/* Hero Image */}
        <div className="bg-white border border-line p-6">
          <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-ink/50 mb-3">Hero Image</label>
          <ImageUpload
            value={heroImageUrl}
            onChange={setHeroImageUrl}
            folder="news"
          />
        </div>

        {/* Body */}
        <div className="bg-white border border-line p-6">
          <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-ink/50 mb-2">Body Content (HTML)</label>
          <textarea
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            rows={16}
            className="w-full border border-line px-3 py-2 font-mono text-sm text-ink focus:outline-none focus:border-orange resize-y"
            placeholder="<p>Article content…</p>"
          />
        </div>

        {/* Publish settings */}
        <div className="bg-white border border-line p-6 flex flex-wrap gap-6 items-end">
          <div>
            <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-ink/50 mb-2">Publish Date</label>
            <input
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="border border-line px-3 py-2 font-sans text-sm text-ink focus:outline-none focus:border-orange"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="accent-orange w-4 h-4"
            />
            <span className="font-sans text-sm text-ink">Publish immediately</span>
          </label>
        </div>

        {error && <p className="font-sans text-sm text-red-600">{error}</p>}
        {success && <p className="font-sans text-sm text-green-600">Saved successfully.</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? "Saving…" : isNew ? "Create Article" : "Save Changes"}
          </button>
          <Link href="/admin/news-events" className="font-sans text-sm px-4 py-2 border border-line text-ink/60 hover:bg-cream-alt transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
