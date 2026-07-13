"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Developer = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  state: string | null;
  is_published: boolean;
  profile_id: string | null;
  listings_count: number;
};

type Visibility = "all" | "published" | "hidden";

export default function DevelopersTable({ developers }: { developers: Developer[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("all");

  const [deleteModal, setDeleteModal] = useState<Developer | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = developers.filter((d) => {
    if (search) {
      const q = search.toLowerCase();
      if (!d.name.toLowerCase().includes(q) && !(d.state ?? "").toLowerCase().includes(q)) return false;
    }
    if (visibility === "published" && !d.is_published) return false;
    if (visibility === "hidden" && d.is_published) return false;
    return true;
  });

  async function togglePublished(dev: Developer) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/developers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: dev.id, is_published: !dev.is_published }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Could not update visibility.");
        return;
      }
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteModal) return;
    if (confirmText !== deleteModal.name) {
      setError(`Type "${deleteModal.name}" exactly to confirm.`);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/developers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteModal.id }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Could not delete developer.");
        return;
      }
      setDeleteModal(null);
      setConfirmText("");
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search name or state…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 flex-1 max-w-md"
        />
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as Visibility)}
          className="border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 cursor-pointer"
        >
          <option value="all">All visibility</option>
          <option value="published">Published only</option>
          <option value="hidden">Hidden only</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 mb-4">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-line overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-cream/40 border-b border-line">
            <tr>
              <th className="px-4 py-3 font-sans text-xs font-semibold text-ink/60 uppercase tracking-wider">Logo</th>
              <th className="px-4 py-3 font-sans text-xs font-semibold text-ink/60 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 font-sans text-xs font-semibold text-ink/60 uppercase tracking-wider">State</th>
              <th className="px-4 py-3 font-sans text-xs font-semibold text-ink/60 uppercase tracking-wider">Listings</th>
              <th className="px-4 py-3 font-sans text-xs font-semibold text-ink/60 uppercase tracking-wider">Linked</th>
              <th className="px-4 py-3 font-sans text-xs font-semibold text-ink/60 uppercase tracking-wider">Published</th>
              <th className="px-4 py-3 font-sans text-xs font-semibold text-ink/60 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center font-sans text-sm text-ink/40">
                  No developers match the current filter.
                </td>
              </tr>
            ) : (
              filtered.map((dev) => (
                <tr key={dev.id} className="border-b border-line last:border-0 hover:bg-cream/20">
                  <td className="px-4 py-3">
                    {dev.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={dev.logo_url} alt={dev.name} className="h-8 w-auto max-w-[80px] object-contain" />
                    ) : (
                      <span className="font-mono text-[10px] uppercase tracking-widest text-ink/30">no logo</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-sans text-sm font-medium text-ink">{dev.name}</td>
                  <td className="px-4 py-3 font-sans text-sm text-ink/60">{dev.state ?? "—"}</td>
                  <td className="px-4 py-3 font-sans text-sm text-ink/60">{dev.listings_count}</td>
                  <td className="px-4 py-3">
                    {dev.profile_id ? (
                      <span className="font-mono text-[10px] uppercase tracking-widest text-green-600">linked</span>
                    ) : (
                      <span className="font-mono text-[10px] uppercase tracking-widest text-ink/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {/* Segmented Publish/Hide — the active state is highlighted,
                        the other side is a clear action label, so there's no
                        guessing what a click will do. */}
                    <div className="inline-flex border border-line">
                      <button
                        type="button"
                        onClick={() => { if (!dev.is_published) togglePublished(dev); }}
                        disabled={busy || isPending || dev.is_published}
                        aria-pressed={dev.is_published}
                        className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 transition-colors ${
                          dev.is_published
                            ? "bg-green-500 text-white cursor-default"
                            : "bg-white text-ink/60 hover:bg-green-50 hover:text-green-700"
                        }`}
                      >
                        Publish
                      </button>
                      <button
                        type="button"
                        onClick={() => { if (dev.is_published) togglePublished(dev); }}
                        disabled={busy || isPending || !dev.is_published}
                        aria-pressed={!dev.is_published}
                        className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border-l border-line transition-colors ${
                          !dev.is_published
                            ? "bg-ink/70 text-white cursor-default"
                            : "bg-white text-ink/60 hover:bg-cream/60 hover:text-ink"
                        }`}
                      >
                        Hide
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/admin/developers/${dev.id}`}
                        className="font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border border-navy text-navy hover:bg-navy hover:text-white transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => { setDeleteModal(dev); setConfirmText(""); setError(null); }}
                        className="font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border border-red-300 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => !busy && setDeleteModal(null)}>
          <div className="bg-white max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-sans font-semibold text-lg text-ink mb-2">Delete developer?</h2>
            <p className="font-sans text-sm text-ink/70 mb-4">
              This will remove <strong>{deleteModal.name}</strong> from the directory.
              {deleteModal.listings_count > 0 && (
                <> {deleteModal.listings_count} development{deleteModal.listings_count === 1 ? "" : "s"} currently linked to this developer will have their developer link cleared.</>
              )}
            </p>
            <p className="font-sans text-sm text-ink/70 mb-3">
              Type <code className="bg-cream px-1.5 py-0.5 text-xs">{deleteModal.name}</code> to confirm:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 mb-3"
              autoFocus
            />
            {error && <p className="text-red-600 font-sans text-sm mb-3">{error}</p>}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => { setDeleteModal(null); setConfirmText(""); }}
                disabled={busy}
                className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-ink/20 text-ink/60 hover:bg-cream/40 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={busy || confirmText !== deleteModal.name}
                className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy ? "Deleting…" : "Delete forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
