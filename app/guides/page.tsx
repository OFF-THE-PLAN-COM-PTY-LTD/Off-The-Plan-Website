import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase/public";
import type { JournalArticle } from "@/types/journal";
import { formatDate } from "@/lib/utils";
import { AdSlot } from "@/components/ad-slot";

export const metadata: Metadata = {
  title: "Guides | Off The Plan",
  description: "Property guides to help you buy, invest and navigate off-the-plan developments in Australia.",
};

// Always fetch fresh from Supabase — prevents stale cached page after content updates
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

// Page 1 = 2 large featured + 9 in 3-col grid = 11 cards (mirrors /news).
// Subsequent pages = 12 cards in 3-col grid.
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
    <div className="absolute inset-0 flex items-center justify-center bg-navy/80">
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

interface GuidesPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function GuidesPage({ searchParams }: GuidesPageProps) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const pageSize = page === 1 ? PAGE_ONE_SIZE : PAGE_SIZE;
  const from = page === 1 ? 0 : PAGE_ONE_SIZE + (page - 2) * PAGE_SIZE;
  const to = from + pageSize - 1;

  const fields = page === 1
    ? "id,slug,title,category,hero_image_url,author,read_time_minutes,published_at,body_html"
    : "id,slug,title,category,hero_image_url,author,read_time_minutes,published_at";
  const { data, count } = await supabase
    .from("journal_articles")
    .select(fields, { count: "exact" })
    .eq("is_published", true)
    .ilike("category", "%Guide%")
    .order("published_at", { ascending: false })
    .range(from, to);

  const articles = (data ?? []) as unknown as JournalArticle[];
  const totalCount = count ?? 0;
  const totalPages = totalCount === 0
    ? 0
    : 1 + Math.ceil(Math.max(0, totalCount - PAGE_ONE_SIZE) / PAGE_SIZE);

  // Page 1: top 2 featured large + rest in 3-col grid (matches /news).
  // Other pages: all in 3-col grid.
  const featured = page === 1 ? articles.slice(0, 2) : [];
  const rest = page === 1 ? articles.slice(2) : articles;

  return (
    <div className="min-h-screen bg-[#f5f4f1] pt-16">

      {/* ── Page header (eyebrow + heading match the legacy site) ── */}
      <section className="bg-[#eeecea] border-b border-line py-10">
        <div className="container-padded">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/50 mb-2">
            Latest Property Guides
          </p>
          <h1 className="font-mono text-[2rem] uppercase tracking-[0.18em] text-navy font-medium">
            Guides
          </h1>
        </div>
      </section>

      {/* Wider container at xl+ so the right-rail banner sits closer to the
          viewport edge, matching /news. */}
      <div className="mx-auto max-w-screen-xl xl:max-w-screen-2xl px-6 md:px-10 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-10 lg:gap-12 xl:gap-20">
          <div className="min-w-0">

        {articles.length === 0 ? (
          <p className="font-sans text-body-md text-ink/40 text-center py-16">
            No guides published yet.
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
                    <div className="relative aspect-[6/5] overflow-hidden bg-navy/10 flex-shrink-0">
                      {article.hero_image_url ? (
                        <Image
                          src={article.hero_image_url}
                          alt={article.title}
                          fill
                          className="object-cover object-right transition-transform duration-500 group-hover:scale-105"
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

            {/* ── Rest / all articles — 2-up at sm/lg, 3-up at xl+ where the
                container widens, so each card still has room next to the rail. ── */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
                {rest.map((article) => (
                  <Link
                    key={article.id}
                    href={`/journal/${article.slug}`}
                    className="group flex flex-col bg-white border border-line hover:border-navy/30 transition-colors"
                  >
                    <div className="relative aspect-[6/5] overflow-hidden bg-navy/10 flex-shrink-0">
                      {article.hero_image_url ? (
                        <Image
                          src={article.hero_image_url}
                          alt={article.title}
                          fill
                          className="object-cover object-right transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <ImagePlaceholder />
                      )}
                    </div>
                    <div className="flex flex-col flex-1 p-5">
                      {article.published_at && (
                        <p className="font-mono text-[9px] uppercase tracking-widest text-ink/30 mb-1">
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
                {page > 1 ? (
                  <Link
                    href={page === 2 ? "/guides" : `/guides?page=${page - 1}`}
                    prefetch={false}
                    className="font-mono text-[11px] uppercase tracking-widest px-4 py-2 border border-line text-ink/60 hover:border-navy hover:text-navy transition-colors"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="font-mono text-[11px] uppercase tracking-widest px-4 py-2 border border-line text-ink/20 cursor-not-allowed">
                    Previous
                  </span>
                )}

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={p === 1 ? "/guides" : `/guides?page=${p}`}
                    prefetch={false}
                    className={`font-mono text-[11px] tracking-widest w-9 h-9 flex items-center justify-center border transition-colors ${
                      p === page
                        ? "border-navy bg-navy text-white"
                        : "border-line text-ink/60 hover:border-navy hover:text-navy"
                    }`}
                  >
                    {p}
                  </Link>
                ))}

                {page < totalPages ? (
                  <Link
                    href={`/guides?page=${page + 1}`}
                    prefetch={false}
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

          {/* ── Right-rail skyscraper (lg+ only). Sits at the top of the rail
              and scrolls with the page — not sticky. Mirrors /news. ── */}
          <aside className="hidden lg:block">
            <div className="flex flex-col items-end">
              <AdSlot page="guides" position="right" />
            </div>
          </aside>
        </div>
      </div>

      {/* ── Bottom ad slot ── */}
      <div className="container-padded pb-8">
        <AdSlot page="guides" position="bottom" />
      </div>


    </div>
  );
}
