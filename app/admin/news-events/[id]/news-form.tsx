"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImageUpload } from "@/components/admin/image-upload";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

type Article = {
  id: string;
  title: string;
  slug: string;
  category: "News" | "Guides" | string | null;
  subtitle: string | null;
  hero_image_url: string | null;
  list_page_image_url: string | null;
  article_image_one: string | null;
  article_image_two: string | null;
  body_html: string | null;
  is_published: boolean;
  published_at: string | null;
  read_time_minutes: number | null;
  meta_title: string | null;
  meta_content: string | null;
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
  const [category, setCategory] = useState<"News" | "Guides">(
    existing?.category === "Guides" ? "Guides" : "News",
  );
  const [subtitle, setSubtitle] = useState(existing?.subtitle ?? "");
  const [bodyHtml, setBodyHtml] = useState(existing?.body_html ?? "");
  const [isPublished, setIsPublished] = useState(existing?.is_published ?? false);
  const [publishedAt, setPublishedAt] = useState(
    existing?.published_at ? existing.published_at.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [readTime, setReadTime] = useState<number | "">(existing?.read_time_minutes ?? "");
  const [metaTitle, setMetaTitle] = useState(existing?.meta_title ?? "");
  const [metaContent, setMetaContent] = useState(existing?.meta_content ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(existing?.hero_image_url ?? "");
  const [listPageImage, setListPageImage] = useState(existing?.list_page_image_url ?? "");
  const [articleImageOne, setArticleImageOne] = useState(existing?.article_image_one ?? "");
  const [articleImageTwo, setArticleImageTwo] = useState(existing?.article_image_two ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!slugManual) setSlug(slugify(title));
  }, [title, slugManual]);

  // Card thumbnails on /news, /journal, /guides and the home page use
  // list_page_image_url. If the editor publishes without one the cards fall
  // back to the hero image — which has the article title baked in, making
  // it look broken. Block publishing in that case (drafts are still fine).
  const missingListImageOnPublish = isPublished && !listPageImage;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (missingListImageOnPublish) {
      setError("Please upload a List Page Image before publishing — it's used as the card thumbnail on /news, the home page, etc. Save as Draft if you don't have one yet.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);

    // The <input type="date"> control gives us "YYYY-MM-DD". Convert to a
    // proper ISO timestamp before sending so the timestamptz column stores
    // a real timestamp (not a string that may be parsed inconsistently).
    const publishedAtISO = publishedAt
      ? new Date(`${publishedAt}T00:00:00`).toISOString()
      : null;

    const payload = {
      ...(isNew ? {} : { id }),
      title,
      slug,
      category,
      subtitle: subtitle || null,
      hero_image_url: heroImageUrl || null,
      list_page_image_url: listPageImage || null,
      article_image_one: articleImageOne || null,
      article_image_two: articleImageTwo || null,
      body_html: bodyHtml || null,
      is_published: isPublished,
      published_at: publishedAtISO,
      read_time_minutes: readTime !== "" ? Number(readTime) : null,
      meta_title: metaTitle || null,
      meta_content: metaContent || null,
    };

    const res = await fetch("/api/admin/news", {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    setSaving(false);

    if (!res.ok) { setError(json.error ?? "Failed to save."); return; }
    setSuccess(true);
    if (isNew) setTimeout(() => router.push("/admin/news-events"), 800);
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-navy flex items-center gap-3 px-6 py-4 mb-6">
        <Link href="/admin/news-events" className="font-sans text-sm text-white/50 hover:text-white transition-colors">
          ← News & Events
        </Link>
        <span className="text-white/20">/</span>
        <h1 className="font-display font-light text-white text-xl">
          {isNew ? "New Article" : "News and Events Detail"}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* Left column — content */}
          <div className="space-y-5">
            {/* Title + Slug */}
            <div className="bg-white border border-line p-6 space-y-4">
              <div>
                <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-ink/50 mb-1">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full border border-line px-3 py-2 font-sans text-sm text-ink focus:outline-none focus:border-orange"
                  placeholder="Article title…"
                />
              </div>
              <div>
                <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-ink/50 mb-1">Slug *</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
                  required
                  className="w-full border border-line px-3 py-2 font-mono text-sm text-ink focus:outline-none focus:border-orange"
                />
              </div>
              <div>
                <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-ink/50 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full border border-line px-3 py-2 font-sans text-sm text-ink focus:outline-none focus:border-orange"
                  placeholder="Short subtitle…"
                />
              </div>
              <div>
                <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-ink/50 mb-1">Page Type *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as "News" | "Guides")}
                  className="w-full border border-line px-3 py-2 font-sans text-sm text-ink bg-white focus:outline-none focus:border-orange"
                >
                  <option value="News">News</option>
                  <option value="Guides">Guides</option>
                </select>
                <p className="font-sans text-[11px] text-ink/40 mt-1">
                  Determines whether this article appears on the News page or the Guides page.
                </p>
              </div>
            </div>

            {/* Body content */}
            <div className="bg-white border border-line p-6">
              <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-ink/50 mb-2">Content *</label>
              <RichTextEditor value={bodyHtml} onChange={setBodyHtml} minHeight={420} />
              <p className="font-mono text-[10px] text-ink/30 mt-1">
                Chars: {bodyHtml.length} · Words: {bodyHtml.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length}
              </p>
            </div>

            {/* Publish + metadata */}
            <div className="bg-white border border-line p-6 space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-wider text-ink/50 mb-2">Publish?</p>
                  <label className="flex items-center gap-2 cursor-pointer mb-1">
                    <input type="radio" checked={isPublished} onChange={() => setIsPublished(true)} className="accent-orange" />
                    <span className="font-sans text-sm text-ink">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={!isPublished} onChange={() => setIsPublished(false)} className="accent-orange" />
                    <span className="font-sans text-sm text-ink">No</span>
                  </label>
                </div>
                <div>
                  <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-ink/50 mb-2">Publish Date</label>
                  <input
                    type="date"
                    value={publishedAt}
                    onChange={(e) => setPublishedAt(e.target.value)}
                    className="border border-line px-3 py-2 font-sans text-sm text-ink focus:outline-none focus:border-orange w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-ink/50 mb-1">Read Time (minutes)</label>
                <input
                  type="number"
                  value={readTime}
                  onChange={(e) => setReadTime(e.target.value === "" ? "" : Number(e.target.value))}
                  min={1}
                  className="border border-line px-3 py-2 font-sans text-sm text-ink focus:outline-none focus:border-orange w-32"
                />
              </div>
              <div>
                <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-ink/50 mb-1">Meta Title</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full border border-line px-3 py-2 font-sans text-sm text-ink focus:outline-none focus:border-orange"
                />
              </div>
              <div>
                <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-ink/50 mb-1">Meta Content</label>
                <textarea
                  value={metaContent}
                  onChange={(e) => setMetaContent(e.target.value)}
                  rows={3}
                  className="w-full border border-line px-3 py-2 font-sans text-sm text-ink focus:outline-none focus:border-orange resize-none"
                />
              </div>
            </div>
          </div>

          {/* Right column — images */}
          <div className="space-y-5">
            <div className="bg-white border border-line p-5">
              <p className="font-sans text-xs font-semibold uppercase tracking-wider text-orange mb-1">
                Main Article Image <span className="text-ink/40 normal-case font-normal">(1600×500)</span>
              </p>
              <p className="font-sans text-[11px] text-ink/50 mb-3 leading-snug">
                Wide banner at the top of the article page itself. Title text is often typeset onto this image — that&apos;s fine here.
              </p>
              <ImageUpload label="" value={heroImageUrl} onChange={setHeroImageUrl} bucket="journal-images" />
            </div>

            <div className={`bg-white border p-5 ${missingListImageOnPublish ? "border-red-400" : "border-line"}`}>
              <p className="font-sans text-xs font-semibold uppercase tracking-wider text-orange mb-1">
                List Page Image <span className="text-ink/40 normal-case font-normal">(600×500)</span>
                {isPublished && <span className="ml-2 text-red-500 normal-case">· Required to publish</span>}
              </p>
              <p className="font-sans text-[11px] text-ink/50 mb-3 leading-snug">
                Card thumbnail shown on <span className="font-mono">/news</span>, the home page and other listings. Use a clean photo <span className="font-semibold">without the article title overlaid</span> — the title is added by the page.
              </p>
              <ImageUpload label="" value={listPageImage} onChange={setListPageImage} bucket="journal-images" />
              {missingListImageOnPublish && (
                <p className="font-sans text-[12px] text-red-600 mt-2">
                  Upload a list page image, or set Publish to No to save as a draft.
                </p>
              )}

              {/* Mini preview so the editor sees what the card will actually look like */}
              {listPageImage && (
                <div className="mt-4 pt-4 border-t border-line">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink/40 mb-2">Card preview</p>
                  <div className="max-w-[220px]">
                    <div className="relative aspect-[6/5] bg-navy/10 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={listPageImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-ink/40 mt-2">
                      {publishedAt || "DD MMM YYYY"}
                    </p>
                    <p className="font-display font-light text-navy text-sm leading-snug mt-1 line-clamp-3">
                      {title || "Article title appears here"}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-white border border-line p-5">
              <p className="font-sans text-xs font-semibold uppercase tracking-wider text-orange mb-3">
                Article Image One <span className="text-ink/40 normal-case font-normal">(600×500)</span>
              </p>
              <ImageUpload label="" value={articleImageOne} onChange={setArticleImageOne} bucket="journal-images" />
            </div>
            <div className="bg-white border border-line p-5">
              <p className="font-sans text-xs font-semibold uppercase tracking-wider text-orange mb-3">
                Article Image Two <span className="text-ink/40 normal-case font-normal">(600×500)</span>
              </p>
              <ImageUpload label="" value={articleImageTwo} onChange={setArticleImageTwo} bucket="journal-images" />
            </div>
          </div>
        </div>

        {error && <p className="font-sans text-sm text-red-600 mt-4">{error}</p>}
        {success && <p className="font-sans text-sm text-green-600 mt-4">Saved successfully.</p>}

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={saving || missingListImageOnPublish}
            title={missingListImageOnPublish ? "Upload a List Page Image before publishing." : undefined}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <Link href="/admin/news-events" className="font-sans text-sm px-4 py-2 border border-line text-ink/60 hover:bg-cream-alt transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
