import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase/public";
import type { JournalArticle } from "@/types/journal";
import { formatDate } from "@/lib/utils";
import { AdSlot } from "@/components/ad-slot";

export const metadata: Metadata = {
  title: "News | Off The Plan",
  description: "The latest property news and market updates from Off The Plan.",
};

// Always fetch fresh from Supabase — prevents stale cached page after content updates
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

// Page 1 = 2 featured + 9 in 3-col grid = 11 cards (3 clean rows of 3)
// Subsequent pages = 12 cards in 3-col grid (4 clean rows of 3)
const PAGE_ONE_SIZE = 11;
const PAGE_SIZE = 12;

/** Strip HTML and remove the social-share boilerplate at the top of every scraped article. */
function extractExcerpt(html: string | null, maxLen = 180): string {
  if (!html) return "";
  const plain = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const afterShare = plain.replace(
    /^(Share\s*)?(Print\s*)?(Email\s*)?(LinkedIn\s*)?(Instagram\s*)?(Facebook\s*)?(Twitter\s*)?(WhatsApp\s*)?/i,
    ""
  ).trim();
  return afterShare.slice(0, maxLen);
}

/** Placeholder tile shown when an article has no hero image. */
function ImagePlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-ink/70">
      <Image
        src="/logo.png"
        alt=""
        width={120}
        height={32}
        className="h-8 w-auto object-contain brightness-0 invert opacity-30"
      />
    </div>
  );
}

interface NewsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  // Page 1 spans 0..10 (11 cards); subsequent pages start after that, 12 cards each.
  const pageSize = page === 1 ? PAGE_ONE_SIZE : PAGE_SIZE;
  const from = page === 1 ? 0 : PAGE_ONE_SIZE + (page - 2) * PAGE_SIZE;
  const to = from + pageSize - 1;

  // Only select fields used on the list — skip body_html for non-featured rows
  // to keep payload small. We still fetch body_html for the page-1 featured cards.
  const fields = page === 1
    ? "id,slug,title,category,hero_image_url,author,read_time_minutes,published_at,body_html"
    : "id,slug,title,category,hero_image_url,author,read_time_minutes,published_at";
  const { data, count } = await supabase
    .from("journal_articles")
    .select(fields, { count: "exact" })
    .eq("is_published", true)
    .ilike("category", "%News%")
    .order("published_at", { ascending: false })
    .range(from, to);

  const articles = (data ?? []) as unknown as JournalArticle[];
  const totalCount = count ?? 0;
  const totalPages = totalCount === 0
    ? 0
    : 1 + Math.ceil(Math.max(0, totalCount - PAGE_ONE_SIZE) / PAGE_SIZE);

  // First page: show top 2 as large featured cards, rest as 3-col grid
  // Other pages: all articles in 3-col grid
  const featured = page === 1 ? articles.slice(0, 2) : [];
  const rest = page === 1 ? articles.slice(2) : articles;

  return (
    <div className="min-h-screen bg-cream pt-16">

      {/* ── Page header ── */}
      <section className="bg-[#eeecea] border-b border-line py-10">
        <div className="container-padded">
          <h1 className="font-mono text-[2rem] uppercase tracking-[0.18em] text-navy font-medium">
            Latest Property News
          </h1>
        </div>
      </section>

      <div className="container-padded py-12">

        {articles.length === 0 ? (
          <p className="font-sans text-body-md text-ink/40 text-center py-16">
            No news articles yet — check back soon.
          </p>
        ) : (
          <>
            {/* ── Featured top 2 — large cards (page 1 only) ── */}
            {featured.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {featured.map((article) => (
                  <Link
                    key={article.id}
                    href={`/journal/${article.slug}`}
                    className="group flex flex-col bg-white border border-line hover:border-navy/30 transition-colors"
                  >
                    <div className="relative aspect-[6/5] overflow-hidden bg-ink/10 flex-shrink-0">
                      {article.hero_image_url ? (
                        <Image
                          src={article.hero_image_url}
                          alt={article.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      ) : (
                        <ImagePlaceholder />
                      )}
                    </div>
                    <div className="flex flex-col flex-1 p-6">
                      {article.published_at && (
                        <p className="font-mono text-[10px] uppercase tracking-widest text-ink/40 mb-3">
                          {formatDate(article.published_at)}
                        </p>
                      )}
                      <h2 className="font-sans font-semibold text-navy text-[1.05rem] leading-snug mb-3 group-hover:text-orange transition-colors">
                        {article.title}
                      </h2>
                      {article.body_html && (
                        <p className="font-sans text-[13px] text-ink/60 leading-relaxed mb-5 line-clamp-3">
                          {extractExcerpt(article.body_html)}
                        </p>
                      )}
                      <div className="mt-auto">
                        <span className="inline-block font-mono text-[10px] uppercase tracking-widest px-5 py-2 border border-navy text-navy group-hover:bg-navy group-hover:text-white transition-colors">
                          Read More
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* ── Remaining / all articles — 3-col grid ── */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {rest.map((article) => (
                  <Link
                    key={article.id}
                    href={`/journal/${article.slug}`}
                    className="group flex flex-col bg-white border border-line hover:border-navy/30 transition-colors"
                  >
                    <div className="relative aspect-[6/5] overflow-hidden bg-ink/10 flex-shrink-0">
                      {article.hero_image_url ? (
                        <Image
                          src={article.hero_image_url}
                          alt={article.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <ImagePlaceholder />
                      )}
                    </div>
                    <div className="flex flex-col flex-1 p-5">
                      {article.published_at && (
                        <p className="font-mono text-[10px] uppercase tracking-widest text-ink/40 mb-2">
                          {formatDate(article.published_at)}
                        </p>
                      )}
                      <h3 className="font-sans font-semibold text-navy text-[0.9rem] leading-snug mb-4 flex-1 group-hover:text-orange transition-colors">
                        {article.title}
                      </h3>
                      <span className="inline-block font-mono text-[10px] uppercase tracking-widest px-5 py-2 border border-navy text-navy group-hover:bg-navy group-hover:text-white transition-colors self-start">
                        Read More
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 py-4">
                {/* Previous */}
                {page > 1 ? (
                  <Link
                    href={page === 2 ? "/news" : `/news?page=${page - 1}`}
                    className="font-mono text-[11px] uppercase tracking-widest px-4 py-2 border border-line text-ink/60 hover:border-navy hover:text-navy transition-colors"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="font-mono text-[11px] uppercase tracking-widest px-4 py-2 border border-line text-ink/20 cursor-not-allowed">
                    Previous
                  </span>
                )}

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={p === 1 ? "/news" : `/news?page=${p}`}
                    className={`font-mono text-[11px] tracking-widest w-9 h-9 flex items-center justify-center border transition-colors ${
                      p === page
                        ? "border-navy bg-navy text-white"
                        : "border-line text-ink/60 hover:border-navy hover:text-navy"
                    }`}
                  >
                    {p}
                  </Link>
                ))}

                {/* Next */}
                {page < totalPages ? (
                  <Link
                    href={`/news?page=${page + 1}`}
                    className="font-mono text-[11px] uppercase tracking-widest px-4 py-2 border border-line text-ink/60 hover:border-navy hover:text-navy transition-colors"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="font-mono text-[11px] uppercase tracking-widest px-4 py-2 border border-line text-ink/20 cursor-not-allowed">
                    Next
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Bottom ad slot ── */}
      <div className="container-padded pb-8">
        <AdSlot page="news" position="bottom" />
      </div>

      {/* ── Partner banner ── */}
      <div className="container-padded pb-14">
        <div className="max-w-3xl mx-auto">
          <Image
            src="/off-the-plan-banner-landscape.png"
            alt="Off The Plan Partner Network"
            width={1200}
            height={200}
            className="w-full h-auto object-contain"
          />
        </div>
      </div>

    </div>
  );
}
