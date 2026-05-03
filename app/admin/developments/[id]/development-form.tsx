"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/admin/image-upload";

interface DevelopmentData {
  id?: string;
  name?: string;
  slug?: string;
  suburb?: string;
  state?: string;
  price_display?: string;
  completion_quarter?: string;
  beds_min?: number;
  beds_max?: number;
  summary?: string;
  status?: string;
  is_published?: boolean;
  is_featured?: boolean;
  hero_image_url?: string;
}

interface Props {
  id: string;
  existing?: DevelopmentData;
}

export function DevelopmentForm({ id, existing }: Props) {
  const router = useRouter();
  const isNew = id === "new";

  const [name, setName] = useState(existing?.name ?? "");
  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [suburb, setSuburb] = useState(existing?.suburb ?? "");
  const [state, setState] = useState(existing?.state ?? "");
  const [priceDisplay, setPriceDisplay] = useState(existing?.price_display ?? "");
  const [completionQuarter, setCompletionQuarter] = useState(existing?.completion_quarter ?? "");
  const [bedsMin, setBedsMin] = useState<number | "">(existing?.beds_min ?? "");
  const [bedsMax, setBedsMax] = useState<number | "">(existing?.beds_max ?? "");
  const [summary, setSummary] = useState(existing?.summary ?? "");
  const [status, setStatus] = useState(existing?.status ?? "Selling now");
  const [isPublished, setIsPublished] = useState(existing?.is_published ?? false);
  const [isFeatured, setIsFeatured] = useState(existing?.is_featured ?? false);
  const [heroImageUrl, setHeroImageUrl] = useState(existing?.hero_image_url ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      id: isNew ? undefined : id,
      name,
      slug,
      suburb: suburb || null,
      state: state || null,
      price_display: priceDisplay || null,
      completion_quarter: completionQuarter || null,
      beds_min: bedsMin === "" ? null : bedsMin,
      beds_max: bedsMax === "" ? null : bedsMax,
      summary: summary || null,
      status,
      is_published: isPublished,
      is_featured: isFeatured,
      hero_image_url: heroImageUrl || null,
    };

    const res = await fetch("/api/admin/developments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, _method: isNew ? "POST" : "PATCH" }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Something went wrong. Please try again.");
      setSaving(false);
      return;
    }

    router.push("/admin/developments");
    router.refresh();
  }

  const inputClass =
    "w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md text-ink outline-none focus:border-orange/60 transition-colors";
  const labelClass = "section-label block mb-1.5";

  return (
    <div>
      <Link
        href="/admin/developments"
        className="inline-flex items-center gap-1.5 font-mono text-label-sm uppercase tracking-widest text-ink/40 hover:text-orange transition-colors mb-6"
      >
        ← Back to Developments
      </Link>

      <h1 className="font-display font-light text-navy text-section-lg mb-8">
        {isNew ? "New development" : `Edit: ${existing?.name}`}
      </h1>

      {error && (
        <p className="mb-6 font-sans text-body-md text-red-600 bg-red-50 border border-red-200 px-4 py-3">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
        {/* Hero image upload */}
        <ImageUpload
          label="Hero Image"
          value={heroImageUrl}
          onChange={setHeroImageUrl}
          bucket="development-images"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Slug *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className={inputClass + " font-mono text-label-lg"}
            />
          </div>
          <div>
            <label className={labelClass}>Suburb</label>
            <input type="text" value={suburb} onChange={(e) => setSuburb(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>State</label>
            <select value={state} onChange={(e) => setState(e.target.value)} className={inputClass + " cursor-pointer"}>
              <option value="">Select</option>
              {["VIC", "NSW", "QLD", "WA", "SA"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Price display</label>
            <input type="text" value={priceDisplay} onChange={(e) => setPriceDisplay(e.target.value)} placeholder="e.g. From $750K" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Completion</label>
            <input type="text" value={completionQuarter} onChange={(e) => setCompletionQuarter(e.target.value)} placeholder="e.g. Q4 2027" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Beds min</label>
            <input
              type="number"
              value={bedsMin}
              onChange={(e) => setBedsMin(e.target.value === "" ? "" : Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Beds max</label>
            <input
              type="number"
              value={bedsMax}
              onChange={(e) => setBedsMax(e.target.value === "" ? "" : Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Summary</label>
          <textarea
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className={inputClass + " resize-none"}
          />
        </div>

        <div>
          <label className={labelClass}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass + " cursor-pointer"}>
            <option value="Selling now">Selling now</option>
            <option value="Final release">Final release</option>
            <option value="Register interest">Register interest</option>
          </select>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="w-4 h-4 accent-orange" />
            <span className="section-label">Published</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-4 h-4 accent-orange" />
            <span className="section-label">Featured on homepage</span>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : isNew ? "Create development" : "Save changes"}
          </button>
          <Link href="/admin/developments" className="btn-ghost">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
