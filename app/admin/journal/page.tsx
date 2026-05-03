import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";

export default async function AdminJournalPage() {
  const { data } = await supabaseAdmin
    .from("journal_articles")
    .select("id, title, category, is_published, published_at")
    .order("published_at", { ascending: false });

  const articles = data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-light text-navy text-section-lg">Journal</h1>
        <Link href="/admin/journal/new" className="btn-primary">+ New article</Link>
      </div>
      <div className="bg-white border border-line overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line">
              <th className="font-sans text-sm font-semibold text-ink/60 px-4 py-4">Title</th>
              <th className="font-sans text-sm font-semibold text-ink/60 px-4 py-4">Category</th>
              <th className="font-sans text-sm font-semibold text-ink/60 px-4 py-4">Status</th>
              <th className="font-sans text-sm font-semibold text-ink/60 px-4 py-4">Published</th>
              <th className="font-sans text-sm font-semibold text-ink/60 px-4 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article: any) => (
              <tr key={article.id} className="border-b border-line last:border-0 hover:bg-cream-alt transition-colors">
                <td className="px-4 py-4 font-sans text-sm text-navy max-w-xs truncate">{article.title}</td>
                <td className="px-4 py-3 font-sans text-sm text-ink/70">{article.category}</td>
                <td className="px-4 py-3">
                  <span className={`font-sans text-sm ${article.is_published ? "text-green-600" : "text-ink/30"}`}>
                    {article.is_published ? "Live" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3 font-sans text-sm text-ink/70">{article.published_at ? formatDate(article.published_at) : "—"}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/journal/${article.id}`} className="font-sans text-sm font-medium text-orange hover:underline">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
