"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Article = {
  id: string;
  title: string;
  slug: string;
  hero_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-AU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).replace(",", "");
}

export default function NewsTable({ articles }: { articles: Article[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<Article | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function togglePublish(article: Article) {
    setLoadingId(article.id);
    const nowISO = new Date().toISOString();
    await fetch("/api/admin/news", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: article.id,
        is_published: !article.is_published,
        published_at: !article.is_published ? nowISO : article.published_at,
      }),
    });
    setLoadingId(null);
    startTransition(() => router.refresh());
  }

  async function handleDelete() {
    if (!deleteModal || confirmText !== "DELETE") return;
    setDeleting(true);
    await fetch("/api/admin/news", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteModal.id }),
    });
    setDeleting(false);
    setDeleteModal(null);
    setConfirmText("");
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="bg-white border border-line overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-orange/30">
              {["Title", "Date & Time", "Status", "Actions"].map((h) => (
                <th key={h} className="font-mono text-[11px] uppercase tracking-widest text-orange px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => {
              const dateStr = a.published_at ?? a.created_at;
              return (
                <tr key={a.id} className="border-b border-line last:border-0 hover:bg-cream-alt transition-colors">
                  {/* Title */}
                  <td className="px-4 py-3 max-w-sm">
                    <Link
                      href={`/admin/news-events/${a.id}`}
                      className="font-sans text-sm font-semibold text-navy hover:text-orange transition-colors line-clamp-2"
                    >
                      {a.title}
                    </Link>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-mono text-[11px] text-ink/60">{formatDateTime(dateStr)}</span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`inline-block font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border ${
                      a.is_published
                        ? "border-green-500 text-green-800"
                        : "border-line text-ink"
                    }`}>
                      {a.is_published ? "Published" : "Draft"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        onClick={() => togglePublish(a)}
                        disabled={loadingId === a.id}
                        className={`font-mono text-[10px] uppercase tracking-widest px-2 py-1.5 border transition-colors disabled:opacity-40 whitespace-nowrap ${
                          a.is_published
                            ? "border-line text-ink hover:border-navy hover:text-navy"
                            : "border-green-400 text-green-800 hover:bg-green-500 hover:text-white hover:border-green-500"
                        }`}
                      >
                        {loadingId === a.id ? "…" : a.is_published ? "Unpublish" : "Publish"}
                      </button>
                      <Link
                        href={`/admin/news-events/${a.id}`}
                        className="font-mono text-[10px] uppercase tracking-widest px-2 py-1.5 border border-orange text-orange hover:bg-orange hover:text-white transition-colors whitespace-nowrap"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => { setDeleteModal(a); setConfirmText(""); }}
                        className="font-mono text-[10px] uppercase tracking-widest px-2 py-1.5 border border-red-400 text-red-700 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors whitespace-nowrap"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {articles.length === 0 && (
          <p className="text-center font-sans text-sm text-ink/40 py-12">No news articles yet.</p>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-line w-full max-w-md p-6 shadow-lg">
            <h2 className="font-display font-semibold text-navy text-lg mb-1">Delete Article</h2>
            <p className="font-sans text-sm text-ink/60 mb-4 line-clamp-2">
              This will permanently delete &ldquo;{deleteModal.title}&rdquo;. This cannot be undone.
            </p>
            <p className="font-sans text-sm text-ink mb-2">
              Type <span className="font-mono font-bold">DELETE</span> to confirm:
            </p>
            <input
              autoFocus
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full border border-line px-3 py-2 text-sm font-mono mb-4 focus:outline-none focus:border-navy"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="font-sans text-sm px-4 py-2 border border-line text-ink/60 hover:bg-cream-alt transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== "DELETE" || deleting}
                className="font-sans text-sm px-4 py-2 bg-red-500 text-white font-semibold disabled:opacity-40 hover:bg-red-600 transition-colors"
              >
                {deleting ? "Deleting…" : "Delete Article"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
