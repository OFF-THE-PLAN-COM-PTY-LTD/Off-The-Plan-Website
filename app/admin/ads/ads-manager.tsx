"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Ad } from "./page";

const PAGES = [
  { value: "home", label: "Home" },
  { value: "listings", label: "Listings" },
  { value: "resources", label: "Resources" },
  { value: "news", label: "News" },
  { value: "guides", label: "Guides" },
] as const;

const POSITIONS = [
  { value: "top", label: "Top" },
  { value: "middle", label: "Middle" },
  { value: "bottom", label: "Bottom" },
  { value: "right", label: "Right" },
] as const;

// Recommended dimensions by position
const DIMS: Record<string, { desktop: string; mobile: string }> = {
  bottom: { desktop: "970×250", mobile: "300×300" },
  top:    { desktop: "970×250", mobile: "300×300" },
  middle: { desktop: "500×500", mobile: "300×300" },
  right:  { desktop: "300×600 (skyscraper)", mobile: "300×300" },
};

type Draft = Omit<Ad, "id"> & { id: string; _new?: boolean; _dirty?: boolean };

function emptyDraft(): Draft {
  return {
    id: `tmp_${Math.random().toString(36).slice(2, 10)}`,
    page: "home",
    position: "bottom",
    ad_type: "image",
    desktop_image_url: null,
    mobile_image_url: null,
    web_link: null,
    adsense_code: null,
    is_active: true,
    sort_order: 0,
    _new: true,
    _dirty: true,
  };
}

export default function AdsManager({ initial }: { initial: Ad[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Draft[]>(initial.map((a) => ({ ...a })));
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Draft | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  function update(id: string, patch: Partial<Draft>) {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, ...patch, _dirty: true } : row)));
  }

  function addRow() {
    setRows((r) => [...r, emptyDraft()]);
  }

  async function deleteRow() {
    if (!deleteConfirm || confirmText !== "DELETE") return;
    const target = deleteConfirm;
    if (target._new) {
      setRows((r) => r.filter((row) => row.id !== target.id));
    } else {
      const res = await fetch("/api/admin/ads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: target.id }),
      });
      if (res.ok) {
        setRows((r) => r.filter((row) => row.id !== target.id));
        showToast("ok", "Ad deleted");
      } else {
        showToast("err", "Delete failed");
      }
    }
    setDeleteConfirm(null);
    setConfirmText("");
  }

  function showToast(kind: "ok" | "err", msg: string) {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 2500);
  }

  async function saveAll() {
    setSaving(true);
    let ok = 0;
    let errors = 0;
    for (const row of rows) {
      if (!row._dirty) continue;
      const payload = {
        page: row.page,
        position: row.position,
        ad_type: row.ad_type,
        desktop_image_url: row.desktop_image_url || null,
        mobile_image_url: row.mobile_image_url || null,
        web_link: row.web_link || null,
        adsense_code: row.adsense_code || null,
        is_active: row.is_active,
        sort_order: row.sort_order ?? 0,
      };
      const res = row._new
        ? await fetch("/api/admin/ads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/ads", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: row.id, ...payload }),
          });
      if (res.ok) ok++; else errors++;
    }
    setSaving(false);
    showToast(errors ? "err" : "ok", errors ? `Saved ${ok}, ${errors} failed` : `Saved ${ok} change${ok === 1 ? "" : "s"}`);
    router.refresh();
  }

  const dirtyCount = rows.filter((r) => r._dirty).length;

  return (
    <div>
      {/* Header */}
      <div className="bg-navy flex items-center justify-between px-6 py-4 mb-6">
        <h1 className="font-display font-light text-white text-xl">Ads Management</h1>
        <button
          onClick={addRow}
          className="font-mono text-[11px] uppercase tracking-widest px-4 py-2 border border-white/40 text-white hover:bg-white hover:text-navy transition-colors"
        >
          + Add Ad
        </button>
      </div>

      <p className="px-6 mb-4 font-mono text-[10px] uppercase tracking-widest text-orange">
        ** Page, Position and Type are required to SAVE.
      </p>

      {/* Table */}
      <div className="bg-white border border-line overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-orange/30">
              {["#", "Page", "Position", "Type", "Details", "Status", "Action"].map((h) => (
                <th key={h} className="font-mono text-[11px] uppercase tracking-widest text-orange px-3 py-3 align-top">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const dims = DIMS[row.position] ?? DIMS.bottom;
              return (
                <tr key={row.id} className={`border-b border-line last:border-0 align-top ${row._dirty ? "bg-orange/5" : ""}`}>
                  <td className="px-3 py-3 font-mono text-[11px] text-ink/60">{i + 1}</td>

                  {/* Page */}
                  <td className="px-3 py-3">
                    <select
                      value={row.page}
                      onChange={(e) => update(row.id, { page: e.target.value as Ad["page"] })}
                      className="border border-line px-2 py-1.5 font-sans text-sm text-ink focus:outline-none focus:border-orange w-full"
                    >
                      {PAGES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </td>

                  {/* Position */}
                  <td className="px-3 py-3">
                    <select
                      value={row.position}
                      onChange={(e) => update(row.id, { position: e.target.value as Ad["position"] })}
                      className="border border-line px-2 py-1.5 font-sans text-sm text-ink focus:outline-none focus:border-orange w-full"
                    >
                      {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </td>

                  {/* Type */}
                  <td className="px-3 py-3">
                    <select
                      value={row.ad_type}
                      onChange={(e) => update(row.id, { ad_type: e.target.value as Ad["ad_type"] })}
                      className="border border-line px-2 py-1.5 font-sans text-sm text-ink focus:outline-none focus:border-orange w-full"
                    >
                      <option value="image">Image</option>
                      <option value="adsense">AdSense</option>
                    </select>
                  </td>

                  {/* Details */}
                  <td className="px-3 py-3 min-w-[420px]">
                    {row.ad_type === "image" ? (
                      <div className="space-y-3">
                        <ImageField
                          label={`Desktop banner (${dims.desktop})`}
                          value={row.desktop_image_url ?? ""}
                          onChange={(v) => update(row.id, { desktop_image_url: v })}
                        />
                        <ImageField
                          label={`Mobile banner (${dims.mobile})`}
                          value={row.mobile_image_url ?? ""}
                          onChange={(v) => update(row.id, { mobile_image_url: v })}
                        />
                        <div>
                          <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/40 mb-1">Web Link</label>
                          <input
                            type="text"
                            value={row.web_link ?? ""}
                            onChange={(e) => update(row.id, { web_link: e.target.value })}
                            placeholder="https://example.com"
                            className="w-full border border-line px-2 py-1.5 font-sans text-sm text-ink focus:outline-none focus:border-orange"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/40 mb-1">AdSense Code</label>
                        <textarea
                          value={row.adsense_code ?? ""}
                          onChange={(e) => update(row.id, { adsense_code: e.target.value })}
                          rows={4}
                          placeholder="<script>...</script>"
                          className="w-full border border-line px-2 py-1.5 font-mono text-xs text-ink focus:outline-none focus:border-orange resize-y"
                        />
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => update(row.id, { is_active: !row.is_active })}
                      className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border transition-colors ${
                        row.is_active
                          ? "border-green-500 text-green-800 bg-green-50 hover:bg-green-100"
                          : "border-line text-ink/60 hover:border-ink"
                      }`}
                    >
                      {row.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>

                  {/* Action */}
                  <td className="px-3 py-3">
                    <button
                      onClick={() => { setDeleteConfirm(row); setConfirmText(""); }}
                      className="font-mono text-[10px] uppercase tracking-widest px-2 py-1.5 border border-red-400 text-red-700 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <p className="text-center font-sans text-sm text-ink/40 py-12">No ads yet. Click &ldquo;+ Add Ad&rdquo; to create one.</p>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between mt-6 px-6">
        <button
          onClick={addRow}
          className="font-mono text-[11px] uppercase tracking-widest px-4 py-2 border border-line text-ink hover:border-navy hover:text-navy transition-colors"
        >
          + Add Ad
        </button>
        <button
          onClick={saveAll}
          disabled={saving || dirtyCount === 0}
          className="font-mono text-[11px] uppercase tracking-widest px-6 py-2 bg-navy text-white hover:bg-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving…" : dirtyCount > 0 ? `Save (${dirtyCount} changed)` : "Save"}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-2 font-sans text-sm shadow-lg border ${
          toast.kind === "ok" ? "bg-green-50 border-green-500 text-green-800" : "bg-red-50 border-red-500 text-red-700"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-line w-full max-w-md p-6 shadow-lg">
            <h2 className="font-display font-semibold text-navy text-lg mb-1">Delete Ad</h2>
            <p className="font-sans text-sm text-ink/60 mb-4">
              This will permanently delete this ad slot. This cannot be undone.
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
                onClick={() => setDeleteConfirm(null)}
                className="font-sans text-sm px-4 py-2 border border-line text-ink/60 hover:bg-cream-alt transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteRow}
                disabled={confirmText !== "DELETE"}
                className="font-sans text-sm px-4 py-2 bg-red-500 text-white font-semibold disabled:opacity-40 hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact image input — preview + paste URL + file upload
function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", "journal-images");
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Upload failed");
      } else {
        onChange(json.url);
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/40 mb-1">{label}</label>
      <div className="flex items-start gap-2">
        {value ? (
          <div className="relative w-20 h-12 flex-shrink-0 bg-cream-alt border border-line overflow-hidden">
            <Image src={value} alt="" fill className="object-cover" sizes="80px" />
          </div>
        ) : (
          <div className="w-20 h-12 flex-shrink-0 bg-cream-alt border border-line flex items-center justify-center font-mono text-[9px] text-ink/30">
            None
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste image URL"
            className="w-full border border-line px-2 py-1 font-sans text-xs text-ink focus:outline-none focus:border-orange"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="font-mono text-[10px] uppercase tracking-widest px-2 py-1 border border-line text-ink/70 hover:border-navy hover:text-navy disabled:opacity-40 transition-colors"
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="font-mono text-[10px] uppercase tracking-widest text-red-600/80 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
            className="sr-only"
          />
          {error && <p className="font-mono text-[10px] text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
