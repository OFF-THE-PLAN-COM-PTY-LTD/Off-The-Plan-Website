import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import NewsTable from "./news-table";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

interface SearchParams { page?: string }

export default async function NewsEventsPage({ searchParams }: { searchParams: SearchParams }) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));

  const { data } = await supabaseAdmin
    .from("journal_articles")
    .select("id, title, slug, is_published, published_at, created_at")
    .eq("category", "News")
    .order("created_at", { ascending: false });

  const articles = (data ?? []) as any[];
  const totalCount = articles.length;
  const publishedCount = articles.filter((a) => a.is_published).length;
  const draftCount = articles.filter((a) => !a.is_published).length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const paginated = articles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          { label: "Total", count: totalCount },
          { label: "Published", count: publishedCount },
          { label: "Drafts", count: draftCount },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-line p-5 text-center">
            <p className="font-sans text-sm text-ink/60 mb-2">{s.label}</p>
            <p className="font-display text-[40px] font-light text-orange leading-none">{s.count}</p>
          </div>
        ))}
      </div>

      <NewsTable articles={paginated} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-1.5 mt-4">
          {page > 1 && (
            <Link
              href={`/admin/news-events?page=${page - 1}`}
              className="font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border border-line text-ink hover:border-navy hover:text-navy transition-colors"
            >
              Previous
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/news-events?page=${p}`}
              className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border transition-colors ${
                p === page
                  ? "border-orange bg-orange text-white"
                  : "border-line text-ink hover:border-navy hover:text-navy"
              }`}
            >
              {p}
            </Link>
          ))}
          {page < totalPages && (
            <Link
              href={`/admin/news-events?page=${page + 1}`}
              className="font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border border-line text-ink hover:border-navy hover:text-navy transition-colors"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
