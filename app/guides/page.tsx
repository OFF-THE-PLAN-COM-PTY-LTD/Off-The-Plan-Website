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

export default async function GuidesPage() {
  const { data } = await supabase
    .from("journal_articles")
    .select("*")
    .eq("is_published", true)
    .eq("category", "Guide")
    .order("published_at", { ascending: false });

  const articles = (data ?? []) as unknown as JournalArticle[];

  const featured  = articles.slice(0, 2);
  const secondary = articles.slice(2, 5);
  const list      = articles.slice(5);

  return (
    <div className="min-h-screen bg-[#f5f4f1] pt-16">

      {/* ── Hero ── */}
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
            {/* ── Section label ── */}
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-navy font-semibold mb-8">
              Latest Property Guides
            </p>

            {/* ── Top featured 2 + ad banner ── */}
            {featured.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {featured.map((article) => (
                  <div key={article.id} className="flex flex-col bg-white border border-line">
                    <div className="relative h-48 overflow-hidden bg-navy/10 flex-shrink-0">
                      {article.hero_image_url ? (
                        <Image
                          src={article.hero_image_url}
                          alt={article.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy/60" />
                      )}
                    </div>
                    <div className="flex flex-col flex-1 p-5">
                      {article.published_at && (
                        <p className="font-mono text-[9px] uppercase tracking-widest text-ink/30 mb-2">
                          {formatDate(article.published_at)}
                        </p>
                      )}
                      <h3 className="font-sans font-semibold text-navy text-[0.95rem] leading-snug mb-2">
                        {article.title}
                      </h3>
                      {article.body_html && (
                        <p className="font-sans text-[13px] text-ink/60 leading-relaxed mb-4 line-clamp-3">
                          {extractExcerpt(article.body_html)}
                        </p>
                      )}
                      <div className="mt-auto">
                        <Link
                          href={`/journal/${article.slug}`}
                          className="inline-block font-mono text-[10px] uppercase tracking-widest px-5 py-2 bg-navy text-white hover:bg-orange transition-colors"
                        >
                          Read More
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Ad banner slot — portrait image */}
                <div className="hidden lg:flex flex-col bg-white border border-line overflow-hidden">
                  <div className="relative flex-1">
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

            {/* ── Secondary row of 3 ── */}
            {secondary.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {secondary.map((article) => (
                  <div key={article.id} className="flex flex-col bg-white border border-line">
                    <div className="relative h-40 overflow-hidden bg-navy/10 flex-shrink-0">
                      {article.hero_image_url ? (
                        <Image
                          src={article.hero_image_url}
                          alt={article.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy/60" />
                      )}
                    </div>
                    <div className="flex flex-col flex-1 p-5">
                      {article.published_at && (
                        <p className="font-mono text-[9px] uppercase tracking-widest text-ink/30 mb-1">
                          {formatDate(article.published_at)}
                        </p>
                      )}
                      <h3 className="font-sans font-semibold text-navy text-[0.9rem] leading-snug mb-4 flex-1">
                        {article.title}
                      </h3>
                      {article.body_html && (
                        <p className="font-sans text-[13px] text-ink/60 leading-relaxed mb-4 line-clamp-2">
                          {extractExcerpt(article.body_html)}
                        </p>
                      )}
                      <Link
                        href={`/journal/${article.slug}`}
                        className="inline-block font-mono text-[10px] uppercase tracking-widest px-5 py-2 bg-navy text-white hover:bg-orange transition-colors self-start"
                      >
                        Read More
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── List format for remaining ── */}
            {list.length > 0 && (
              <div className="flex flex-col divide-y divide-line border-t border-line mb-10">
                {list.map((article) => (
                  <div key={article.id} className="flex gap-5 py-5 bg-white px-4">
                    <div className="relative w-28 h-20 flex-shrink-0 overflow-hidden bg-navy/10">
                      {article.hero_image_url ? (
                        <Image
                          src={article.hero_image_url}
                          alt={article.title}
                          fill
                          className="object-cover"
                          sizes="112px"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy/60" />
                      )}
                    </div>
                    <div className="flex flex-col justify-center flex-1 min-w-0">
                      {article.published_at && (
                        <p className="font-mono text-[9px] uppercase tracking-widest text-ink/30 mb-1">
                          {formatDate(article.published_at)}
                        </p>
                      )}
                      <h3 className="font-sans font-semibold text-navy text-[0.9rem] leading-snug mb-3">
                        {article.title}
                      </h3>
                      <Link
                        href={`/journal/${article.slug}`}
                        className="inline-block font-mono text-[10px] uppercase tracking-widest px-5 py-1.5 bg-navy text-white hover:bg-orange transition-colors self-start"
                      >
                        Read More
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Partner banner ── */}
      <div className="container-padded pb-14 px-16 md:px-24">
        <Image
          src="/off-the-plan-banner-landscape.png"
          alt="Off The Plan Partner Network"
          width={1200}
          height={200}
          className="w-full h-auto object-contain"
        />
      </div>

    </div>
  );
}
