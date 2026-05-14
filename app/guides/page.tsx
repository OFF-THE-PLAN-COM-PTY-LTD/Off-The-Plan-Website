import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase/public";
import type { JournalArticle } from "@/types/journal";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Guides | Off The Plan",
  description: "Property guides to help you buy, invest and navigate off-the-plan developments in Australia.",
};

// Always fetch fresh from Supabase — prevents stale cached page after content updates
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const PAGE_SIZE = 9; // 3-col grid fits 9 neatly

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
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, count } = await supabase
    .from("journal_articles")
    .select("*", { count: "exact" })
    .eq("is_published", true)
    .eq("category", "Guide")
    .order("published_at", { ascending: false })
    .range(from, to);

  const articles = (data ?? []) as unknown as JournalArticle[];
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  // Page 1: top 2 featured large + ad slot, then rest in 3-col grid
  // Other pages: all in 3-col grid
  const featured = page === 1 ? articles.slice(0, 2) : [];
  const rest = page === 1 ? articles.slice(2) : articles;

  return (
    <div className="min-h-screen bg-[#f5f4f1] pt-16">

      {/* ── Page header ── */}
      <section className="bg-[#eeecea] border-b border-line py-10">
        <div className="container-padded">
          <h1 className="font-mono text-[2rem] uppercase tracking-[0.18em] text-navy font-medium">
            Guides
          </h1>
        </div>
      </section>

      <div className="container-padded py-12">

        {articles.length === 0 ? (
          <p className="font-sans text-body-md text-ink/40 text-center py-16">
            No guides published yet.
          </p>
        ) : (
          <>
            {/* ── Featured top 2 + portrait ad slot (page 1 only) ── */}
            {featured.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <ImagePlaceholder />
                      )}
                    </div>
                    <div className="flex flex-col flex-1 p-5">
                      {article.published_at && (
                        <p className="font-mono text-[9px] uppercase tracking-widest text-ink/30 mb-2">
                          {formatDate(article.published_at)}
                        </p>
                      )}
                      <h3 className="font-sans font-semibold text-navy text-[0.95rem] leading-snug mb-2 group-hover:text-orange transition-colors">
                        {article.title}
                      </h3>
                      {article.body_html && (
                        <p className="font-sans text-[13px] text-ink/60 leading-relaxed mb-4 line-clamp-3">
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

                {/* Portrait ad slot — desktop only */}
                <div className="hidden lg:flex flex-col bg-white border border-line overflow-hidden">
                  <div className="relative flex-1 min-h-[280px]">
                    <Image
                      src="/off-the-plan-banner-portrait.png"
                      alt="Off The Plan Partner Network"
                      fill
                      className="object-cover object-top"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Rest / all articles — 3-col grid ── */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
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
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
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
