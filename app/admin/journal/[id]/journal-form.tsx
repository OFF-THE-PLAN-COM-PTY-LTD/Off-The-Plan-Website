"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { JournalArticle, JournalCategory } from "@/types/journal";
import { ImageUpload } from "@/components/admin/image-upload";

const CATEGORIES: JournalCategory[] = ["Editorial", "Market", "Interview", "Guide"];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface Props {
  id: string;
  existing?: JournalArticle;
}

export function JournalForm({ id, existing }: Props) {
  const router = useRouter();
  const isNew = id === "new";

  const [title, setTitle] = useState(existing?.title ?? "");
  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!isNew);
  const [category, setCategory] = useState<JournalCategory>(existing?.category ?? "Editorial");
  const [heroImageUrl, setHeroImageUrl] = useState(existing?.hero_image_url ?? "");
  const [author, setAuthor] = useState(existing?.author ?? "");
  const [readTimeMinutes, setReadTimeMinutes] = useState<number | "">(existing?.read_time_minutes ?? "");
  const [publishedAt, setPublishedAt] = useState(
    existing?.published_at ? existing.published_at.slice(0, 10) : ""
  );
  const [isPublished, setIsPublished] = useState(existing?.is_published ?? false);
  const [bodyHtml, setBodyHtml] = useState(existing?.body_html ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(slugify(title));
    }
  }, [title, slugManuallyEdited]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      id: isNew ? undefined : id,
      title,
      slug,
      category,
      hero_image_url: heroImageUrl || null,
      author: author || null,
      read_time_minutes: readTimeMinutes === "" ? null : readTimeMinutes,
      published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
      is_published: isPublished,
      body_html: bodyHtml || null,
    };

    const res = await fetch("/api/admin/journal", {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Something went wrong. Please try again.");
      setSaving(false);
      return;
    }

    router.push("/admin/journal");
    router.refresh();
  }

  const inputClass =
    "w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md text-ink outline-none focus:border-orange/60 transition-colors";
  const labelClass = "section-label block mb-1.5";

  return (
    <div>
      <Link
        href="/admin/journal"
        className="inline-flex items-center gap-1.5 font-mono text-label-sm uppercase tracking-widest text-ink/40 hover:text-orange transition-colors mb-6"
      >
        ← Back to Journal
      </Link>

      <h1 className="font-display font-light text-navy text-section-lg mb-8">
        {isNew ? "Create Article" : "Edit Article"}
      </h1>

      {error && (
        <p className="mb-6 font-sans text-body-md text-red-600 bg-red-50 border border-red-200 px-4 py-3">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
        <div>
          <label htmlFor="title" className={labelClass}>Title *</label>
          <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Why Off-the-Plan Makes Sense in 2026" className={inputClass} />
        </div>

        <div>
          <label htmlFor="slug" className={labelClass}>Slug *</label>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugManuallyEdited(true); }}
            required
            placeholder="auto-generated-from-title"
            className={inputClass + " font-mono text-label-lg"}
          />
          <p className="mt-1 font-mono text-label-sm text-ink/40">Auto-generated from title. Edit to override.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className={labelClass}>Category *</label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value as JournalCategory)} className={inputClass + " cursor-pointer"}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="author" className={labelClass}>Author</label>
            <input id="author" type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. The Editors" className={inputClass} />
          </div>
        </div>

        <ImageUpload
          label="Hero Image"
          value={heroImageUrl}
          onChange={setHeroImageUrl}
          bucket="journal-images"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="read_time_minutes" className={labelClass}>Read Time (minutes)</label>
            <input id="read_time_minutes" type="number" min={1} max={120} value={readTimeMinutes} onChange={(e) => setReadTimeMinutes(e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 6" className={inputClass} />
          </div>
          <div>
            <label htmlFor="published_at" className={labelClass}>Publish Date</label>
            <input id="published_at" type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="is_published" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="w-4 h-4 accent-orange cursor-pointer" />
          <label htmlFor="is_published" className="section-label cursor-pointer">Published</label>
        </div>

        <div>
          <label htmlFor="body_html" className={labelClass}>Body (HTML)</label>
          <textarea
            id="body_html"
            rows={14}
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            placeholder="<p>Article body HTML…</p>"
            className={inputClass + " resize-y font-mono text-label-lg leading-relaxed"}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : isNew ? "Create Article" : "Save Changes"}
          </button>
          <Link href="/admin/journal" className="btn-ghost">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
