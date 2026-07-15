import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { JournalCard } from "@/components/journal-card";
import { ArticleShareRail } from "@/features/journal/components/article-share-rail";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { supabase } from "@/lib/supabase/public";
import { formatDate } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize-html";
import type { JournalArticle } from "@/types/journal";

interface Props { params: { slug: string } }

/**
 * Convert article body to clean paragraph HTML.
 *
 * Migrated content arrives as plain text with double-newline paragraph
 * breaks (no <p> tags) — without wrapping it ends up rendering as one
 * giant unbroken block. If the source already contains real HTML tags we
 * leave it alone so RichTextEditor output keeps its formatting.
 *
 * Escapes < > & in plain-text branches so user content can't inject HTML.
 */
function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function bodyToHtml(raw: string | null | undefined): string {
  if (!raw) return "";
  const looksLikeHtml = /<(p|div|h[1-6]|ul|ol|li|br|blockquote|img|a)\b/i.test(raw);
  if (looksLikeHtml) return sanitizeHtml(raw);
  // Plain text — split on blank lines, then linebreaks inside each block
  // become <br> so deliberate line breaks survive without inventing
  // paragraphs.
  return raw
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escape(p).replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
}

/**
 * Legacy CMS stored article_image_one/two as a serialised JSON object
 * (`{id, path, filename}`). Older entries hold a plain URL string. Accept
 * both shapes and return the image URL or null.
 */
function parseLegacyImage(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/")) return s;
  try {
    const obj = JSON.parse(s);
    if (obj && typeof obj.path === "string") return obj.path;
  } catch {
    // Not JSON — treat the whole string as a URL even if it doesn't look like one.
    return s;
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await supabase
    .from("journal_articles")
    .select("title, body_html, hero_image_url, list_page_image_url, subtitle")
    .eq("slug", params.slug)
    .single();
  if (!data) return { title: "Not Found" };
  const a = data as { title: string; body_html: string | null; hero_image_url: string | null; list_page_image_url?: string | null; subtitle?: string | null };
  const description = a.subtitle || a.body_html?.replace(/<[^>]+>/g, "").slice(0, 160) || "";
  const ogImage = a.list_page_image_url || a.hero_image_url;
  return {
    title: a.title,
    description,
    openGraph: {
      title: a.title,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { data: rawArticle } = await supabase
    .from("journal_articles")
    .select("*")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .single();

  if (!rawArticle) notFound();
  const article = rawArticle as unknown as JournalArticle & {
    article_image_one?: string | null;
    article_image_two?: string | null;
    subtitle?: string | null;
  };

  const articleImageOne = parseLegacyImage(article.article_image_one);
  const articleImageTwo = parseLegacyImage(article.article_image_two);

  // ── Prev / Next by published_at within the same category, so /news cycles
  //    through News and /guides cycles through Guides cleanly.
  const [prevRes, nextRes, relatedRes] = await Promise.all([
    supabase
      .from("journal_articles")
      .select("id, slug, title, published_at, hero_image_url, list_page_image_url, category")
      .eq("is_published", true)
      .eq("category", article.category)
      .lt("published_at", article.published_at ?? new Date().toISOString())
      .neq("id", article.id)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("journal_articles")
      .select("id, slug, title, published_at, hero_image_url, list_page_image_url, category")
      .eq("is_published", true)
      .eq("category", article.category)
      .gt("published_at", article.published_at ?? new Date(0).toISOString())
      .neq("id", article.id)
      .order("published_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("journal_articles")
      .select("*")
      .eq("is_published", true)
      .eq("category", article.category)
      .neq("id", article.id)
      .limit(3),
  ]);

  type NeighbourArticle = {
    id: string;
    slug: string;
    title: string;
    published_at: string | null;
    hero_image_url: string | null;
    list_page_image_url: string | null;
    category: string;
  };
  let prev = (prevRes.data ?? null) as NeighbourArticle | null;
  let next = (nextRes.data ?? null) as NeighbourArticle | null;
  const related = ((relatedRes.data ?? []) as unknown) as JournalArticle[];

  // Wrap around so prev + next are always both populated (mirrors the
  // legacy site, where Next still shows even on the newest article). If
  // there's no newer article, Next becomes the oldest published in the
  // same category — and vice versa for Previous on the oldest article.
  if (!prev || !next) {
    const ends = await Promise.all([
      !prev
        ? supabase
            .from("journal_articles")
            .select("id, slug, title, published_at, hero_image_url, list_page_image_url, category")
            .eq("is_published", true)
            .eq("category", article.category)
            .neq("id", article.id)
            .order("published_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      !next
        ? supabase
            .from("journal_articles")
            .select("id, slug, title, published_at, hero_image_url, list_page_image_url, category")
            .eq("is_published", true)
            .eq("category", article.category)
            .neq("id", article.id)
            .order("published_at", { ascending: true })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    if (!prev) prev = (ends[0].data ?? null) as NeighbourArticle | null;
    if (!next) next = (ends[1].data ?? null) as NeighbourArticle | null;
  }

  // News & Guides article URLs both live at /journal/{slug}; the back-to-index
  // link should reflect which index the reader came from.
  const indexHref = article.category?.toLowerCase() === "guides" ? "/guides" : "/news";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    author: { "@type": "Person", name: article.author },
    datePublished: article.published_at,
    publisher: { "@type": "Organization", name: "Off The Plan" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="min-h-screen bg-cream pt-16">
        {/* ── Hero image (clean, no title overlay — many migrated hero
              images already have the title baked in, so layering our own
              over the top reads as messy. Title goes below.) ── */}
        <div className="relative h-[40vh] min-h-[280px] md:h-[50vh] md:min-h-[360px] bg-navy">
          {article.hero_image_url ? (
            <Image
              src={article.hero_image_url}
              alt={article.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-navy-deep to-navy-mid" />
          )}
        </div>

        {/* ── Article header (below the hero, like the legacy site) ── */}
        <div className="container-padded max-w-screen-xl pt-8 md:pt-10">
          <Link
            href={indexHref}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-ink/50 hover:text-orange transition-colors mb-4"
          >
            <ChevronLeftIcon size={14} />
            {indexHref === "/guides" ? "All Guides" : "All News"}
          </Link>
          <p className="font-mono text-[10px] uppercase tracking-widest text-orange mb-3">
            {article.category}
            {article.published_at && (
              <span className="text-ink/40 ml-3">{formatDate(article.published_at)}</span>
            )}
          </p>
          <h1 className="font-display font-light text-navy leading-tight text-[clamp(28px,4.5vw,52px)] max-w-4xl">
            {article.title}
          </h1>
        </div>

        {/* ── Body + sidebar (share rail + article images 2 & 3) ─────────── */}
        <div className="container-padded max-w-screen-xl pt-8 md:pt-10 pb-12 md:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-10 lg:gap-14">
            {/* Body */}
            <div className="min-w-0">
              {article.subtitle && (
                <p className="font-display font-light text-navy text-[clamp(18px,1.6vw,22px)] leading-snug mb-8 pb-8 border-b border-line">
                  {article.subtitle}
                </p>
              )}

              <div
                className="article-body font-sans text-body-md text-ink/85 leading-relaxed [&_p]:mb-5 [&_h2]:font-display [&_h2]:font-light [&_h2]:text-navy [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:font-display [&_h3]:font-light [&_h3]:text-navy [&_h3]:text-xl [&_h3]:mt-8 [&_h3]:mb-3 [&_a]:text-orange [&_a]:underline hover:[&_a]:text-navy [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-5 [&_blockquote]:border-l-2 [&_blockquote]:border-orange [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-ink/70"
                dangerouslySetInnerHTML={{ __html: bodyToHtml(article.body_html) }}
              />

              {/* On mobile/tablet, drop the article images here under the body
                  (the sidebar collapses, so this is where they should land). */}
              <div className="lg:hidden mt-10 space-y-6">
                {articleImageOne && (
                  <div className="relative aspect-[4/3] bg-navy/10 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={articleImageOne}
                      alt={`${article.title} — image 2`}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                {articleImageTwo && (
                  <div className="relative aspect-[4/3] bg-navy/10 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={articleImageTwo}
                      alt={`${article.title} — image 3`}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar — share rail + article images 2 & 3 (lg+) */}
            <aside className="hidden lg:block">
              <div className="space-y-6">
                <ArticleShareRail title={article.title} slug={article.slug} />
                {articleImageOne && (
                  <div className="relative aspect-[4/3] bg-navy/10 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={articleImageOne}
                      alt={`${article.title} — image 2`}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                {articleImageTwo && (
                  <div className="relative aspect-[4/3] bg-navy/10 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={articleImageTwo}
                      alt={`${article.title} — image 3`}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            </aside>
          </div>

          {/* Mobile share rail — sits below the body + article images */}
          <div className="lg:hidden mt-10">
            <ArticleShareRail title={article.title} slug={article.slug} />
          </div>

          {/* ── Prev / Next navigation ──────────────────────────────────── */}
          {(prev || next) && (
            <nav aria-label="Article navigation" className="mt-14 pt-10 border-t border-line">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {prev ? (
                  <NeighbourCard direction="prev" article={prev} />
                ) : (
                  <div />
                )}
                {next ? (
                  <NeighbourCard direction="next" article={next} />
                ) : (
                  <div />
                )}
              </div>
            </nav>
          )}
        </div>

        {/* ── Related ─────────────────────────────────────────────────── */}
        {related.length > 0 && (
          <section className="border-t border-line bg-cream-alt py-14">
            <div className="container-padded">
              <h2 className="font-display font-light text-navy text-section-lg mb-8">
                Related reading
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {related.map((a) => <JournalCard key={a.id} article={a} variant="feature" />)}
              </div>
            </div>
          </section>
        )}
      </article>
    </>
  );
}

// ── Prev / Next neighbour card ─────────────────────────────────────────────

function NeighbourCard({
  direction,
  article,
}: {
  direction: "prev" | "next";
  article: {
    slug: string;
    title: string;
    published_at: string | null;
    hero_image_url: string | null;
    list_page_image_url: string | null;
  };
}) {
  const img = article.list_page_image_url || article.hero_image_url;
  const isNext = direction === "next";
  return (
    <Link
      href={`/journal/${article.slug}`}
      className={`group flex bg-white border border-line hover:border-navy/30 transition-colors overflow-hidden ${isNext ? "flex-row-reverse" : ""}`}
    >
      <div className="relative w-32 sm:w-40 flex-shrink-0 bg-navy/10">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        ) : null}
      </div>
      <div className={`flex flex-col justify-center p-4 sm:p-5 min-w-0 ${isNext ? "text-right" : ""}`}>
        <p className={`font-mono text-[10px] uppercase tracking-widest text-orange mb-1.5 flex items-center gap-1.5 ${isNext ? "justify-end" : ""}`}>
          {!isNext && <ChevronLeftIcon size={12} />}
          {isNext ? "Next" : "Previous"}
          {isNext && <ChevronRightIcon size={12} />}
        </p>
        {article.published_at && (
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink/40 mb-1">
            {formatDate(article.published_at)}
          </p>
        )}
        <h3 className="font-display font-light text-navy text-sm sm:text-base leading-snug line-clamp-3 group-hover:text-orange transition-colors">
          {article.title}
        </h3>
      </div>
    </Link>
  );
}
