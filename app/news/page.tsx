import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase/public";
import type { JournalArticle, JournalCategory } from "@/types/journal";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "News & Events | Off The Plan",
  description: "The latest property news, market updates, guides and editorial from Off The Plan.",
};

const categories: (JournalCategory | "All")[] = ["All", "Editorial", "Market", "Interview", "Guide"];

const categoryColors: Record<string, string> = {
  Editorial: "text-orange",
  Market:    "text-navy",
  Interview: "text-ink",
  Guide:     "text-ink/60",
};

interface NewsPageProps {
  searchParams: { category?: string };
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const activeCategory = searchParams.category as JournalCategory | undefined;

  let query = supabase
    .from("journal_articles")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (activeCategory) {
    query = query.eq("category", activeCategory);
  }

  const { data } = await query;
  const articles = (data ?? []) as unknown as JournalArticle[];

  return (
    <div className="min-h-screen bg-cream pt-16">

      {/* Hero */}
      <section className="bg-navy py-20">
        <div className="container-padded">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-ink-light/30 mb-4">
            Off The Plan
          </p>
          <h1 className="font-display font-light text-ink-light text-[clamp(36px,8vw,64px)] leading-none tracking-tight">
            News &amp; Events
          </h1>
        </div>
      </section>

      {/* Category tabs */}
      <div className="border-b border-line bg-cream sticky top-16 z-20">
        <div className="container-padded flex gap-0 overflow-x-auto">
          {categories.map((cat) => {
            const isActive = (!activeCategory && cat === "All") || cat === activeCategory;
            return (
              <Link
                key={cat}
                href={cat === "All" ? "/news" : `/news?category=${cat}`}
                className={`font-mono text-[11px] uppercase tracking-widest px-5 py-3.5 border-b-2 flex-shrink-0 transition-colors ${
                  isActive
                    ? "border-orange text-navy"
                    : "border-transparent text-ink/40 hover:text-ink"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {cat}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Articles grid */}
      <div className="container-padded py-14">
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/journal/${article.slug}`}
                className="group flex flex-col bg-white border border-line hover:border-navy/20 transition-colors"
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden bg-navy/10 flex-shrink-0">
                  {article.hero_image_url ? (
                    <Image
                      src={article.hero_image_url}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy/60" />
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-6">
                  {/* Meta */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`font-mono text-[10px] uppercase tracking-widest font-semibold ${categoryColors[article.category] ?? "text-ink/60"}`}>
                      {article.category}
                    </span>
                    {article.read_time_minutes && (
                      <>
                        <span className="text-ink/20">·</span>
                        <span className="font-mono text-[10px] text-ink/40">
                          {article.read_time_minutes} min read
                        </span>
                      </>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-light text-navy text-[1.2rem] leading-snug group-hover:text-orange transition-colors mb-3 flex-1">
                    {article.title}
                  </h3>

                  {/* Date */}
                  {article.published_at && (
                    <p className="font-mono text-[10px] uppercase tracking-widest text-ink/30 mb-5">
                      {formatDate(article.published_at)}
                    </p>
                  )}

                  {/* Read More */}
                  <span className="font-mono text-[10px] uppercase tracking-widest px-5 py-2 border border-ink/20 text-ink/60 group-hover:border-orange group-hover:text-orange transition-colors self-start">
                    Read More
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="font-sans text-body-md text-ink/40 text-center py-16">
            No articles in this category yet.
          </p>
        )}
      </div>

      {/* Partner banner */}
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
