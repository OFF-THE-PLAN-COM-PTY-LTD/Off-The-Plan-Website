"use client";

import { useEffect, useRef, useState } from "react";

interface Banner {
  id: string;
  title: string;
  link: string;
  description: string;
  desktop_image_url: string;
  mobile_image_url: string;
  video_url: string;
  linked_development_id: string;
  sort_order: number;
}

interface DevelopmentOption {
  id: string;
  name: string;
  slug: string;
  suburb: string | null;
  state: string | null;
  developer_name: string | null;
}

type BannerDraft = Omit<Banner, "id"> & { id?: string };

const emptyBanner = (): BannerDraft => ({
  title: "",
  link: "",
  description: "",
  desktop_image_url: "",
  mobile_image_url: "",
  video_url: "",
  linked_development_id: "",
  sort_order: 0,
});

export default function HomepageSetupPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [developments, setDevelopments] = useState<DevelopmentOption[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState<{ id: string; field: "desktop" | "mobile" | "video" } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // drafts keyed by banner id (or "new-N" for unsaved)
  const [drafts, setDrafts] = useState<Record<string, BannerDraft>>({});
  const nextNewId = useRef(0);

  useEffect(() => {
    fetch("/api/admin/homepage-banners")
      .then((r) => r.json())
      .then((data: Banner[]) => {
        // Coerce nulls to empty strings so controlled inputs stay valid.
        const normalised = data.map((b) => ({
          ...b,
          video_url: b.video_url ?? "",
          linked_development_id: b.linked_development_id ?? "",
        }));
        setBanners(normalised);
        const initial: Record<string, BannerDraft> = {};
        normalised.forEach((b) => { initial[b.id] = { ...b }; });
        setDrafts(initial);
      });

    fetch("/api/admin/homepage-banners/developments")
      .then((r) => r.ok ? r.json() : [])
      .then((data: DevelopmentOption[]) => setDevelopments(data ?? []))
      .catch(() => setDevelopments([]));
  }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const setField = (key: string, field: keyof BannerDraft, value: string) => {
    setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  // Upload an image or video to storage, return public URL.
  // Targets the `homepage-banners` bucket which accepts both images and video.
  const uploadFile = async (key: string, field: "desktop" | "mobile" | "video", file: File) => {
    setUploading({ id: key, field });
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", "homepage-banners");
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const json = await res.json();
    setUploading(null);
    if (!res.ok) { showToast(json.error ?? "Upload failed", "error"); return; }
    const dbField: keyof BannerDraft =
      field === "desktop" ? "desktop_image_url" :
      field === "mobile" ? "mobile_image_url" :
      "video_url";
    setField(key, dbField, json.url);
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
    <div className="w-full">
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
              <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                <p className="font-semibold text-gray-700 text-sm">Banner {idx + 1}</p>
              </div>

              {/* Two-column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">

                {/* Left — form fields (2/3 width) */}
                <div className="lg:col-span-2 px-6 py-6 flex flex-col gap-5">
                  {/* Linked development — drives overlay text + link target */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 font-medium">
                      Linked Project
                    </label>
                    <select
                      value={draft.linked_development_id}
                      onChange={(e) => setField(key, "linked_development_id", e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-blue-400"
                    >
                      <option value="">— No linked project (use Title/Link below) —</option>
                      {developments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}{d.suburb ? ` — ${d.suburb}` : ""}{d.state ? `, ${d.state}` : ""}
                          {d.developer_name ? ` (${d.developer_name})` : ""}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      Selecting a project auto-fills the hero overlay text and links the hero to that project&apos;s page.
                    </p>
                  </div>

                  {/* Title + Link (overrides — used when no linked project) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-medium">
                        Title <span className="text-gray-400">(override)</span>
                      </label>
                      <input
                        type="text"
                        value={draft.title}
                        onChange={(e) => setField(key, "title", e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
                        placeholder="e.g. FLORIAN"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-medium">
                        Link <span className="text-gray-400">(used only when no linked project)</span>
                      </label>
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
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1 font-medium">Description (optional)</label>
                    <textarea
                      rows={3}
                      value={draft.description}
                      onChange={(e) => setField(key, "description", e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400 resize-none"
                      placeholder="Short tagline shown under the hero overlay (optional)…"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => saveBanner(key)}
                      disabled={isSaving || isDeleting}
                      className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-white rounded transition-opacity hover:opacity-80 disabled:opacity-50"
                      style={{ background: "#1a2340" }}
                    >
                      {isSaving ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={() => deleteBanner(key)}
                      disabled={isSaving || isDeleting}
                      className="px-6 py-2 text-xs font-bold uppercase tracking-widest border border-red-400 text-red-500 rounded transition-opacity hover:bg-red-50 disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>

                {/* Right — media uploads (1/3 width) */}
                <div className="px-6 py-6 flex flex-col gap-6 bg-gray-50">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Hero Media Upload</p>

                  <ImageUploadField
                    label="Hero Video (mp4 / webm):"
                    hint="(Max 100 MB. Plays muted on autoloop. Optional.)"
                    currentUrl={draft.video_url}
                    isUploading={uploading?.id === key && uploading.field === "video"}
                    onFile={(file) => uploadFile(key, "video", file)}
                    onClear={() => setField(key, "video_url", "")}
                    accept="video/mp4,video/webm,video/quicktime"
                    isVideo
                  />
                  <ImageUploadField
                    label="Desktop Image:"
                    hint="(1920×1080. Used as poster + fallback when no video.)"
                    currentUrl={draft.desktop_image_url}
                    isUploading={uploading?.id === key && uploading.field === "desktop"}
                    onFile={(file) => uploadFile(key, "desktop", file)}
                    onClear={() => setField(key, "desktop_image_url", "")}
                    accept="image/*"
                  />
                  <ImageUploadField
                    label="Mobile Image:"
                    hint="(500×500. Shown on small screens.)"
                    currentUrl={draft.mobile_image_url}
                    isUploading={uploading?.id === key && uploading.field === "mobile"}
                    onFile={(file) => uploadFile(key, "mobile", file)}
                    onClear={() => setField(key, "mobile_image_url", "")}
                    accept="image/*"
                  />
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
  accept?: string;
  isVideo?: boolean;
}

function ImageUploadField({
  label,
  hint,
  currentUrl,
  isUploading,
  onFile,
  onClear,
  accept = "image/*",
  isVideo = false,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hovered, setHovered] = useState(false);

  return (
    <div>
      <p className="text-xs font-medium text-gray-600 mb-2">{label}</p>

      {currentUrl ? (
        <div className="mb-2">
          {isVideo ? (
            <video
              src={currentUrl}
              controls
              muted
              playsInline
              className="w-full rounded border border-gray-200 bg-black"
              style={{ maxHeight: 160 }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUrl}
              alt="Banner preview"
              className="w-full rounded border border-gray-200 object-cover"
              style={{ maxHeight: 120 }}
            />
          )}
          <button
            onClick={onClear}
            className="mt-1 text-xs text-red-500 hover:underline"
          >
            Remove {isVideo ? "video" : "image"}
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="px-3 py-1.5 text-xs font-semibold rounded border transition-all duration-200 disabled:opacity-50"
          style={{
            background: hovered ? "#e85d26" : "transparent",
            borderColor: hovered ? "#e85d26" : "#9ca3af",
            color: hovered ? "#fff" : "#4b5563",
            transform: hovered ? "scale(1.03)" : "scale(1)",
          }}
        >
          {isUploading ? "Uploading…" : "Select File"}
        </button>
        {!currentUrl && !isUploading && (
          <span className="text-xs text-gray-400">No file chosen</span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1.5">
        <span style={{ color: "#e85d26" }}>{hint}</span>
      </p>
    </div>
  );
}
