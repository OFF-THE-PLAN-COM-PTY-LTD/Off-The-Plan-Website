import type { Metadata } from "next";
import Link from "next/link";
import { JournalCard } from "@/components/journal-card";
import { mockJournalArticles } from "@/lib/mock-data";
import type { JournalCategory } from "@/types/journal";

export const metadata: Metadata = {
  title: "The Residences Journal",
  description: "Market reports, interviews, buyer guides and editorial insight from Off The Plan.",
};

const categories: (JournalCategory | "All")[] = ["All", "Editorial", "Market", "Interview", "Guide"];

interface JournalPageProps {
  searchParams: { category?: string };
}

export default function JournalPage({ searchParams }: JournalPageProps) {
  const activeCategory = searchParams.category as JournalCategory | undefined;
  const articles = activeCategory
    ? mockJournalArticles.filter((a) => a.category === activeCategory && a.is_published)
    : mockJournalArticles.filter((a) => a.is_published);

  return (
    <div className="min-h-screen bg-cream pt-16">
      {/* Hero */}
      <section className="bg-navy py-20">
        <div className="container-padded">
          <p className="section-label text-ink-light/30 mb-4">Issue 04 · {new Date().toLocaleDateString("en-AU", { month: "long", year: "numeric" })}</p>
          <h1 className="font-display font-light text-ink-light text-[clamp(36px,8vw,64px)] leading-none tracking-tight">The Residences Journal</h1>
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
                href={cat === "All" ? "/journal" : `/journal?category=${cat}`}
                className={`font-mono text-label-lg uppercase tracking-widest px-5 py-3.5 border-b-2 flex-shrink-0 transition-colors ${
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {articles.map((article, i) => (
            <JournalCard
              key={article.id}
              article={article}
              variant={i === 0 && !activeCategory ? "feature" : "compact"}
              className={i === 0 && !activeCategory ? "sm:col-span-2" : ""}
            />
          ))}
        </div>
        {articles.length === 0 && (
          <p className="font-sans text-body-md text-ink/40 text-center py-16">No articles in this category yet.</p>
        )}
      </div>
    </div>
  );
}
