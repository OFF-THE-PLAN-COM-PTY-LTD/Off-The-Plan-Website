"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface DeveloperFormValues {
  id?: string;
  slug: string;
  name: string;
  description: string;
  logo_url: string;
  website: string;
  abn: string;
  state: string;
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

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className={lbl}>Logo URL</label>
          <input
            type="url"
            value={form.logo_url}
            onChange={(e) => set("logo_url", e.target.value)}
            placeholder="https://…"
            className={inp}
          />
          {form.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.logo_url} alt="Logo preview" className="mt-2 h-10 w-auto max-w-[140px] object-contain" />
          )}
        </div>
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
          <label className={lbl}>State</label>
          <select value={form.state} onChange={(e) => set("state", e.target.value)} className={inp + " cursor-pointer"}>
            <option value="">— Select —</option>
            {["ACT","NSW","NT","QLD","SA","TAS","VIC","WA"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={lbl}>ABN</label>
          <input
            type="text"
            value={form.abn}
            onChange={(e) => set("abn", e.target.value)}
            placeholder="11 222 333 444"
            className={inp}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className={lbl}>Linked Member Profile</label>
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
