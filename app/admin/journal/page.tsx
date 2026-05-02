import Link from "next/link";
import { mockJournalArticles } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export default function AdminJournalPage() {
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
              <th className="font-mono text-label-sm uppercase tracking-widest text-ink/40 px-4 py-3">Title</th>
              <th className="font-mono text-label-sm uppercase tracking-widest text-ink/40 px-4 py-3">Category</th>
              <th className="font-mono text-label-sm uppercase tracking-widest text-ink/40 px-4 py-3">Published</th>
              <th className="font-mono text-label-sm uppercase tracking-widest text-ink/40 px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockJournalArticles.map((article) => (
              <tr key={article.id} className="border-b border-line last:border-0 hover:bg-cream-alt transition-colors">
                <td className="px-4 py-3 font-sans text-body-md text-navy max-w-xs truncate">{article.title}</td>
                <td className="px-4 py-3 font-mono text-label-sm text-ink/60">{article.category}</td>
                <td className="px-4 py-3 font-mono text-label-sm text-ink/60">{article.published_at ? formatDate(article.published_at) : "—"}</td>
                <td className="px-4 py-3"><Link href={`/admin/journal/${article.id}`} className="font-mono text-label-sm text-orange hover:underline">Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
