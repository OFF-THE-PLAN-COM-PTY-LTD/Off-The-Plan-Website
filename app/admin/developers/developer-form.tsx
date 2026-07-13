"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Logo upload control — file picker + preview. Posts to the existing
 * /api/admin/upload endpoint (same one the listing form uses for hero
 * images, agent photos, etc.) and stores the returned URL in logo_url.
 *
 * Replaces the bare URL text input that was here before — Tim asked
 * (Jun 2026 feedback) for a real upload control matching the rest of
 * the admin UI, not a paste-a-URL field.
 */
function LogoUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "development-images");
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (res.ok && json.url) onChange(json.url);
      else setError(json.error ?? "Upload failed");
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border border-line bg-cream-alt px-5 py-5 flex flex-col items-center gap-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-navy font-bold">Developer Logo</p>
      <div className="w-44 h-28 border border-line bg-white flex items-center justify-center overflow-hidden">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Developer logo" className="w-full h-full object-contain p-2" />
        ) : (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-ink/15" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="font-mono text-[10px] uppercase tracking-widest px-5 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors disabled:opacity-50"
        >
          {uploading ? "Uploading…" : value ? "Replace Logo" : "Upload Logo"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-line text-ink/50 hover:border-red-400 hover:text-red-500 transition-colors"
          >
            Remove
          </button>
        )}
      </div>
      {error && <p className="font-sans text-xs text-red-500">{error}</p>}
      <div className="bg-white border border-line px-5 py-4 w-full">
        <p className="font-mono text-[11px] uppercase tracking-widest text-navy font-bold mb-3">
          Logo Guidelines
        </p>
        <ul className="font-sans text-[13px] text-ink/70 leading-relaxed space-y-1.5">
          <li><span className="text-ink/40 mr-1">•</span> Square (500×500) <span className="text-ink/40">or</span> rectangle (up to 1000×400)</li>
          <li><span className="text-ink/40 mr-1">•</span> PNG with transparent bg recommended</li>
          <li><span className="text-ink/40 mr-1">•</span> JPG / GIF / WEBP also accepted</li>
          <li><span className="text-ink/40 mr-1">•</span> Max file size 5MB</li>
        </ul>
      </div>
    </div>
  );
}

export interface DeveloperFormValues {
  id?: string;
  slug: string;
  name: string;
  description: string;
  logo_url: string;
  website: string;
  abn: string;
  state: string;
  // New admin-editable fields (migration 041) — surfaced on /developers/[slug]
  // when no linked profile takes precedence.
  suburb: string;
  company_email: string;
  phone: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  pinterest: string;
  youtube: string;
  is_published: boolean;
  profile_id: string | null;
}

export interface ProfileOption {
  id: string;
  label: string;
}

export default function DeveloperForm({
  initial,
  profiles,
  mode,
}: {
  initial: DeveloperFormValues;
  profiles: ProfileOption[];
  mode: "new" | "edit";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<DeveloperFormValues>(initial);

  function set<K extends keyof DeveloperFormValues>(key: K, value: DeveloperFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!form.slug.trim()) {
      setError("Slug is required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/developers", {
        method: mode === "new" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(mode === "edit" ? { id: form.id } : {}),
          slug: form.slug.trim(),
          name: form.name.trim(),
          description: form.description || null,
          logo_url: form.logo_url || null,
          website: form.website || null,
          abn: form.abn || null,
          state: form.state || null,
          suburb: form.suburb || null,
          company_email: form.company_email || null,
          phone: form.phone || null,
          facebook: form.facebook || null,
          instagram: form.instagram || null,
          linkedin: form.linkedin || null,
          pinterest: form.pinterest || null,
          youtube: form.youtube || null,
          is_published: form.is_published,
          profile_id: form.profile_id || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Could not save developer.");
        return;
      }
      startTransition(() => router.push("/admin/developers"));
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60";
  const lbl = "block font-sans text-xs font-semibold text-ink/60 uppercase tracking-wider mb-1";

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-line p-6 max-w-3xl">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 mb-4">{error}</div>}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className={lbl}>Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Chanine Developments"
            className={inp}
            required
          />
        </div>
        <div>
          <label className={lbl}>Slug *</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            placeholder="chanine-developments"
            className={inp}
            required
          />
        </div>
      </div>

      <div className="mb-4">
        <label className={lbl}>Description</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          className={inp}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 items-start">
        <LogoUpload value={form.logo_url} onChange={(url) => set("logo_url", url)} />
        <div>
          <label className={lbl}>Website</label>
          <input
            type="url"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            placeholder="https://…"
            className={inp}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className={lbl}>Suburb / City</label>
          <input
            type="text"
            value={form.suburb}
            onChange={(e) => set("suburb", e.target.value)}
            placeholder="e.g. Sydney"
            className={inp}
          />
        </div>
        <div>
          <label className={lbl}>State</label>
          <select value={form.state} onChange={(e) => set("state", e.target.value)} className={inp + " cursor-pointer"}>
            <option value="">— Select —</option>
            {["ACT","NSW","NT","QLD","SA","TAS","VIC","WA"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className={lbl}>Company Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="(02) 1234 5678"
            className={inp}
          />
        </div>
        <div>
          <label className={lbl}>Company Email</label>
          <input
            type="email"
            value={form.company_email}
            onChange={(e) => set("company_email", e.target.value)}
            placeholder="info@example.com"
            className={inp}
          />
          <p className="font-sans text-xs text-ink/40 mt-1">
            Contact-form submissions on this developer&apos;s public page will be sent here.
          </p>
        </div>
      </div>

      <div className="mb-4">
        <label className={lbl}>ABN</label>
        <input
          type="text"
          value={form.abn}
          onChange={(e) => set("abn", e.target.value)}
          placeholder="11 222 333 444"
          className={inp + " max-w-xs"}
        />
      </div>

      {/* ── Social links ── */}
      <div className="mb-4">
        <label className={lbl}>Social links</label>
        <p className="font-sans text-xs text-ink/40 mb-2">Optional. Paste the full URL for each — only the ones you fill will show on the public page.</p>
        <div className="grid grid-cols-2 gap-3">
          <input type="url" value={form.facebook}  onChange={(e) => set("facebook",  e.target.value)} placeholder="Facebook URL"  className={inp} />
          <input type="url" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="Instagram URL" className={inp} />
          <input type="url" value={form.linkedin}  onChange={(e) => set("linkedin",  e.target.value)} placeholder="LinkedIn URL"  className={inp} />
          <input type="url" value={form.pinterest} onChange={(e) => set("pinterest", e.target.value)} placeholder="Pinterest URL" className={inp} />
          <input type="url" value={form.youtube}   onChange={(e) => set("youtube",   e.target.value)} placeholder="YouTube URL"   className={inp} />
        </div>
      </div>

      <div className="mb-4">
        <label className={lbl}>Linked Account Profile</label>
        <select
          value={form.profile_id ?? ""}
          onChange={(e) => set("profile_id", e.target.value || null)}
          className={inp + " cursor-pointer"}
        >
          <option value="">— Not linked —</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        <p className="font-sans text-xs text-ink/40 mt-1">
          Optional. If linked, the developer&apos;s public profile updates automatically when they edit their /portal/profile.
        </p>
      </div>

      <label className="flex items-center gap-3 cursor-pointer mb-6">
        <input
          type="checkbox"
          checked={form.is_published}
          onChange={(e) => set("is_published", e.target.checked)}
          className="w-4 h-4 accent-orange"
        />
        <span className="font-sans text-sm text-ink">Show in the public developers directory at offtheplan.com.au/developers</span>
      </label>

      <div className="flex items-center justify-between">
        <Link
          href="/admin/developers"
          className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-ink/20 text-ink/60 hover:bg-cream/40 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving || isPending}
          className="font-mono text-[10px] uppercase tracking-widest px-6 py-2 bg-navy text-white hover:bg-navy/80 transition-colors disabled:opacity-40"
        >
          {saving ? "Saving…" : mode === "new" ? "Create developer" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
