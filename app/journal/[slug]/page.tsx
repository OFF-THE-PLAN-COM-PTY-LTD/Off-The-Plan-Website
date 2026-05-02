import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { JournalCard } from "@/components/journal-card";
import { supabase } from "@/lib/supabase/public";
import { formatDate } from "@/lib/utils";
import type { JournalArticle } from "@/types/journal";

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await supabase
    .from("journal_articles")
    .select("title, body_html, hero_image_url")
    .eq("slug", params.slug)
    .single();
  if (!data) return { title: "Not Found" };
  return {
    title: data.title,
    description: data.body_html?.replace(/<[^>]+>/g, "").slice(0, 160),
    openGraph: {
      title: data.title,
      images: data.hero_image_url ? [data.hero_image_url] : [],
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
  const article = rawArticle as unknown as JournalArticle;

  const { data: relatedData } = await supabase
    .from("journal_articles")
    .select("*")
    .eq("is_published", true)
    .eq("category", article.category)
    .neq("id", article.id)
    .limit(3);

  const related = (relatedData ?? []) as unknown as JournalArticle[];

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
        {/* Hero image */}
        <div className="relative h-[50vh] bg-navy">
          {article.hero_image_url ? (
            <Image src={article.hero_image_url} alt={article.title} fill className="object-cover opacity-70" priority sizes="100vw" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-navy-deep to-navy-mid" />
          )}
        </div>

        {/* Article header */}
        <div className="container-padded max-w-3xl py-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-label-lg uppercase tracking-widest text-orange">{article.category}</span>
            <span className="text-ink/20">·</span>
            {article.published_at && (
              <span className="font-mono text-label-sm text-ink/40">{formatDate(article.published_at)}</span>
            )}
            {article.read_time_minutes && (
              <>
                <span className="text-ink/20">·</span>
                <span className="font-mono text-label-sm text-ink/40">{article.read_time_minutes} min read</span>
              </>
            )}
          </div>
          <h1 className="font-display font-light text-navy text-section-xl mb-4">{article.title}</h1>
          {article.author && (
            <p className="font-mono text-label-lg text-ink/40 uppercase tracking-widest">By {article.author}</p>
          )}
        </div>

        {/* Body */}
        <div className="container-padded max-w-3xl pb-16">
          <div
            className="prose prose-lg font-sans text-ink/80 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: article.body_html ?? "" }}
          />
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <section className="border-t border-line bg-cream-alt py-14">
            <div className="container-padded">
              <h2 className="font-display font-light text-navy text-section-lg mb-8">Related reading</h2>
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
