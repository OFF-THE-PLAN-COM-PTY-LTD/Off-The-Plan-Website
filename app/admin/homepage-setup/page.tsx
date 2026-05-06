"use client";

import { useEffect, useRef, useState } from "react";

interface Banner {
  id: string;
  title: string;
  link: string;
  description: string;
  desktop_image_url: string;
  mobile_image_url: string;
  sort_order: number;
}

type BannerDraft = Omit<Banner, "id"> & { id?: string };

const emptyBanner = (): BannerDraft => ({
  title: "",
  link: "",
  description: "",
  desktop_image_url: "",
  mobile_image_url: "",
  sort_order: 0,
});

export default function HomepageSetupPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState<{ id: string; field: "desktop" | "mobile" } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // drafts keyed by banner id (or "new-N" for unsaved)
  const [drafts, setDrafts] = useState<Record<string, BannerDraft>>({});
  const nextNewId = useRef(0);

  useEffect(() => {
    fetch("/api/admin/homepage-banners")
      .then((r) => r.json())
      .then((data: Banner[]) => {
        setBanners(data);
        const initial: Record<string, BannerDraft> = {};
        data.forEach((b) => { initial[b.id] = { ...b }; });
        setDrafts(initial);
      });
  }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const setField = (key: string, field: keyof BannerDraft, value: string) => {
    setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  // Upload image to storage, return public URL
  const uploadImage = async (key: string, field: "desktop" | "mobile", file: File) => {
    setUploading({ id: key, field });
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", "banners");
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const json = await res.json();
    setUploading(null);
    if (!res.ok) { showToast(json.error ?? "Upload failed", "error"); return; }
    const imageField = field === "desktop" ? "desktop_image_url" : "mobile_image_url";
    setField(key, imageField, json.url);
  };

  // Save (create or update)
  const saveBanner = async (key: string) => {
    const draft = drafts[key];
    if (!draft) return;
    setSaving(key);

    const isNew = !banners.find((b) => b.id === key);

    if (isNew) {
      const res = await fetch("/api/admin/homepage-banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, sort_order: banners.length }),
      });
      const saved: Banner = await res.json();
      if (!res.ok) { showToast((saved as any).error ?? "Save failed", "error"); setSaving(null); return; }

      // replace the temp key with the real id
      setBanners((prev) => [...prev, saved]);
      setDrafts((prev) => {
        const updated = { ...prev, [saved.id]: { ...saved } };
        delete updated[key];
        return updated;
      });
    } else {
      const res = await fetch(`/api/admin/homepage-banners/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const saved: Banner = await res.json();
      if (!res.ok) { showToast((saved as any).error ?? "Save failed", "error"); setSaving(null); return; }
      setBanners((prev) => prev.map((b) => (b.id === key ? saved : b)));
      setDrafts((prev) => ({ ...prev, [key]: { ...saved } }));
    }

    setSaving(null);
    showToast("Banner saved successfully.");
  };

  // Delete
  const deleteBanner = async (key: string) => {
    const isNew = !banners.find((b) => b.id === key);
    if (isNew) {
      setDrafts((prev) => { const n = { ...prev }; delete n[key]; return n; });
      return;
    }
    if (!confirm("Delete this banner?")) return;
    setDeleting(key);
    await fetch(`/api/admin/homepage-banners/${key}`, { method: "DELETE" });
    setBanners((prev) => prev.filter((b) => b.id !== key));
    setDrafts((prev) => { const n = { ...prev }; delete n[key]; return n; });
    setDeleting(null);
    showToast("Banner deleted.");
  };

  const addBanner = () => {
    const tempKey = `new-${nextNewId.current++}`;
    setDrafts((prev) => ({ ...prev, [tempKey]: emptyBanner() }));
  };

  // All keys: saved banners in order + unsaved new ones at end
  const savedKeys = banners.map((b) => b.id);
  const newKeys = Object.keys(drafts).filter((k) => k.startsWith("new-"));
  const allKeys = [...savedKeys, ...newKeys];

  return (
    <div className="max-w-4xl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded shadow-lg text-white text-sm font-medium transition-all ${
            toast.type === "error" ? "bg-red-500" : "bg-green-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div
        className="px-6 py-4 mb-6 rounded"
        style={{ background: "#1a2340" }}
      >
        <h1 className="text-white font-semibold text-lg tracking-wide">Homepage Setup</h1>
      </div>

      {/* Banners */}
      <div className="flex flex-col gap-6">
        {allKeys.map((key, idx) => {
          const draft = drafts[key];
          if (!draft) return null;
          const isSaving = saving === key;
          const isDeleting = deleting === key;

          return (
            <div key={key} className="border border-gray-200 rounded bg-white overflow-hidden">
              {/* Banner heading */}
              <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                <p className="font-semibold text-gray-700 text-sm">Banner {idx + 1}</p>
              </div>

              <div className="px-5 py-5 flex flex-col gap-5">
                {/* Title + Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 font-medium">Title</label>
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(e) => setField(key, "title", e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
                      placeholder="e.g. FLORIAN"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 font-medium">Link</label>
                    <input
                      type="text"
                      value={draft.link}
                      onChange={(e) => setField(key, "link", e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
                      placeholder="https://offtheplan.com.au/new-apartments/..."
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-medium">Description</label>
                  <textarea
                    rows={4}
                    value={draft.description}
                    onChange={(e) => setField(key, "description", e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400 resize-none"
                    placeholder="Banner description..."
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Banner Images Upload</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Desktop */}
                    <ImageUploadField
                      label="Desktop View:"
                      hint="(Dimensions: 1920x1080)"
                      currentUrl={draft.desktop_image_url}
                      isUploading={uploading?.id === key && uploading.field === "desktop"}
                      onFile={(file) => uploadImage(key, "desktop", file)}
                      onClear={() => setField(key, "desktop_image_url", "")}
                    />
                    {/* Mobile */}
                    <ImageUploadField
                      label="Mobile View:"
                      hint="(Dimensions: 500x500)"
                      currentUrl={draft.mobile_image_url}
                      isUploading={uploading?.id === key && uploading.field === "mobile"}
                      onFile={(file) => uploadImage(key, "mobile", file)}
                      onClear={() => setField(key, "mobile_image_url", "")}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => saveBanner(key)}
                    disabled={isSaving || isDeleting}
                    className="px-5 py-2 text-xs font-bold uppercase tracking-widest text-white border rounded transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ background: "#1a2340", borderColor: "#1a2340" }}
                  >
                    {isSaving ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => deleteBanner(key)}
                    disabled={isSaving || isDeleting}
                    className="px-5 py-2 text-xs font-bold uppercase tracking-widest border border-red-400 text-red-500 rounded transition-opacity hover:bg-red-50 disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Banner */}
      <div className="mt-6">
        <button
          onClick={addBanner}
          className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest border-2 border-gray-400 text-gray-600 rounded hover:border-gray-600 hover:text-gray-800 transition-colors"
        >
          + Add Banner
        </button>
      </div>
    </div>
  );
}

// ── Sub-component ──────────────────────────────────────────────────────────────

interface ImageUploadFieldProps {
  label: string;
  hint: string;
  currentUrl: string;
  isUploading: boolean;
  onFile: (file: File) => void;
  onClear: () => void;
}

function ImageUploadField({ label, hint, currentUrl, isUploading, onFile, onClear }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className="text-xs font-medium text-gray-600 mb-2">{label}</p>

      {currentUrl ? (
        <div className="mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUrl}
            alt="Banner preview"
            className="w-full rounded border border-gray-200 object-cover"
            style={{ maxHeight: 120 }}
          />
          <button
            onClick={onClear}
            className="mt-1 text-xs text-red-500 hover:underline"
          >
            Remove image
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="px-3 py-1.5 text-xs border border-gray-400 rounded text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {isUploading ? "Uploading…" : "Select File"}
        </button>
        {!currentUrl && !isUploading && (
          <span className="text-xs text-gray-400">No file chosen</span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1.5">
        Or upload photo from your computer.{" "}
        <span style={{ color: "#e85d26" }}>{hint}</span>
      </p>
    </div>
  );
}
