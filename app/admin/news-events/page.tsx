import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import NewsTable from "./news-table";

export default async function NewsEventsPage() {
  const { data } = await supabaseAdmin
    .from("journal_articles")
    .select("id, title, slug, hero_image_url, is_published, published_at, created_at")
    .eq("category", "News")
    .order("created_at", { ascending: false });

  const articles = (data ?? []) as any[];
  const publishedCount = articles.filter((a) => a.is_published).length;
  const draftCount = articles.filter((a) => !a.is_published).length;

  return (
    <div>
      <div className="bg-navy flex items-center justify-between px-6 py-4 mb-6">
        <h1 className="font-display font-light text-white text-xl">News and Events</h1>
        <Link
          href="/admin/news-events/new"
          className="font-mono text-[11px] uppercase tracking-widest px-4 py-2 border border-white/40 text-white hover:bg-white hover:text-navy transition-colors"
        >
          + Add News
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total", count: articles.length },
          { label: "Published", count: publishedCount },
          { label: "Drafts", count: draftCount },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-line p-5 text-center">
            <p className="font-sans text-sm text-ink/60 mb-2">{s.label}</p>
            <p className="font-display text-[40px] font-light text-orange leading-none">{s.count}</p>
          </div>
        ))}
      </div>

      <NewsTable articles={articles} />
    </div>
  );
}
