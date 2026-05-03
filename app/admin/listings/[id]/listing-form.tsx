"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/admin/image-upload";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Developer { id: string; name: string }
interface GalleryImage { id: string; url: string; sort_order: number }
interface FloorPlan {
  id?: string;
  plan_type: string;
  config: string;
  internal_sqm: string;
  price_from: string;
  image_url: string;
}

interface ListingData {
  id?: string;
  name?: string;
  slug?: string;
  type?: string;
  tag?: string;
  tier?: string | null;
  developer_id?: string | null;
  suburb?: string;
  state?: string;
  status?: string;
  summary?: string;
  is_published?: boolean;
  is_featured?: boolean;
  lat?: number | null;
  lng?: number | null;
  beds_min?: number | null;
  beds_max?: number | null;
  baths_min?: number | null;
  baths_max?: number | null;
  cars_min?: number | null;
  cars_max?: number | null;
  price_display?: string;
  price_from?: number | null;
  completion_quarter?: string;
  levels?: number | null;
  residence_count?: number | null;
  internal_sqm_min?: number | null;
  internal_sqm_max?: number | null;
  land_size_min?: number | null;
  land_size_max?: number | null;
  lifestyle?: string[];
  features?: string[] | null;
  architect?: string;
  interiors?: string;
  landscape?: string;
  builder?: string;
  nearby_amenities?: string[] | null;
  agent_name?: string;
  agent_phone?: string;
  agent_email?: string;
  agent_agency?: string;
  hero_image_url?: string;
  brochure_url?: string;
  video_url?: string;
  virtual_tour_url?: string;
  seo_title?: string;
  seo_description?: string;
}

interface Props {
  id: string;
  existing?: ListingData;
  developers: Developer[];
  gallery: GalleryImage[];
  floorPlans: FloorPlan[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATES = ["VIC", "NSW", "QLD", "WA", "SA", "ACT", "NT", "TAS"];

const TYPES = [
  "Apartment", "House & Land", "Townhouse", "Villa",
  "Land", "Commercial", "Mixed Use",
];

const STATUSES = [
  "Selling now", "Final release", "Register interest", "Cancelled", "Archived",
];

const LIFESTYLE_OPTIONS = [
  "Pool", "Gymnasium", "Concierge", "Rooftop Terrace", "BBQ Area",
  "Lobby", "Storage", "Security", "Garden", "Tennis Court",
  "Sauna", "Spa", "Yoga Studio", "Theatre Room", "Wine Storage",
  "Co-working Space", "Dog Wash", "Bike Storage",
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function AccordionSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-line">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-cream-alt transition-colors"
      >
        <span className="font-mono text-[11px] uppercase tracking-widest text-navy font-bold">
          {title}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-ink/40 transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-line px-5 py-5 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  function addTag() {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setInput("");
  }

  return (
    <div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest px-2 py-1 bg-navy/5 border border-line text-ink/70"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== tag))}
                className="text-ink/40 hover:text-red-500 ml-0.5 leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder ?? "Type and press Enter to add"}
          className="flex-1 border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 transition-colors"
        />
        <button
          type="button"
          onClick={addTag}
          className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-line text-ink/60 hover:border-navy hover:text-navy transition-colors whitespace-nowrap"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function GalleryManager({
  gallery,
  onAdd,
  onRemove,
}: {
  gallery: GalleryImage[];
  onAdd: (url: string) => void;
  onRemove: (id: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadImage(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "development-images");
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const json = await res.json();
    if (res.ok) onAdd(json.url);
    setUploading(false);
  }

  return (
    <div>
      <p className="section-label block mb-3">Gallery Images</p>
      {gallery.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {gallery.map((img) => (
            <div key={img.id} className="relative group">
              <div className="relative w-full aspect-video overflow-hidden bg-navy/5">
                <Image src={img.url} alt="" fill className="object-cover" sizes="200px" />
              </div>
              <button
                type="button"
                onClick={() => onRemove(img.id)}
                className="absolute top-1 right-1 bg-white/90 hover:bg-red-500 hover:text-white text-ink px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest transition-colors opacity-0 group-hover:opacity-100"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="font-sans text-sm text-ink/40 mb-3">No gallery images yet.</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadImage(f);
          e.target.value = "";
        }}
        className="sr-only"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-line text-ink/60 hover:border-navy hover:text-navy transition-colors disabled:opacity-50"
      >
        {uploading ? "Uploading…" : "+ Add Image"}
      </button>
    </div>
  );
}

// ─── Main Form ───────────────────────────────────────────────────────────────

export function ListingForm({
  id,
  existing,
  developers,
  gallery: initialGallery,
  floorPlans: initialFloorPlans,
}: Props) {
  const router = useRouter();
  const isNew = id === "new";

  // Category
  const [type, setType] = useState(existing?.type ?? "");
  const [tag, setTag] = useState(existing?.tag ?? "");
  const [tier, setTier] = useState(existing?.tier ?? "");

  // Project Overview
  const [name, setName] = useState(existing?.name ?? "");
  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [developerId, setDeveloperId] = useState(existing?.developer_id ?? "");
  const [suburb, setSuburb] = useState(existing?.suburb ?? "");
  const [state, setState] = useState(existing?.state ?? "");
  const [status, setStatus] = useState(existing?.status ?? "Selling now");
  const [summary, setSummary] = useState(existing?.summary ?? "");
  const [isPublished, setIsPublished] = useState(existing?.is_published ?? false);
  const [isFeatured, setIsFeatured] = useState(existing?.is_featured ?? false);
  const [lat, setLat] = useState<number | "">(existing?.lat ?? "");
  const [lng, setLng] = useState<number | "">(existing?.lng ?? "");

  // Configuration Summary
  const [bedsMin, setBedsMin] = useState<number | "">(existing?.beds_min ?? "");
  const [bedsMax, setBedsMax] = useState<number | "">(existing?.beds_max ?? "");
  const [bathsMin, setBathsMin] = useState<number | "">(existing?.baths_min ?? "");
  const [bathsMax, setBathsMax] = useState<number | "">(existing?.baths_max ?? "");
  const [carsMin, setCarsMin] = useState<number | "">(existing?.cars_min ?? "");
  const [carsMax, setCarsMax] = useState<number | "">(existing?.cars_max ?? "");
  const [priceDisplay, setPriceDisplay] = useState(existing?.price_display ?? "");
  const [priceFrom, setPriceFrom] = useState<number | "">(existing?.price_from ?? "");
  const [completionQuarter, setCompletionQuarter] = useState(existing?.completion_quarter ?? "");
  const [levels, setLevels] = useState<number | "">(existing?.levels ?? "");
  const [residenceCount, setResidenceCount] = useState<number | "">(existing?.residence_count ?? "");
  const [internalSqmMin, setInternalSqmMin] = useState<number | "">(existing?.internal_sqm_min ?? "");
  const [internalSqmMax, setInternalSqmMax] = useState<number | "">(existing?.internal_sqm_max ?? "");
  const [landSizeMin, setLandSizeMin] = useState<number | "">(existing?.land_size_min ?? "");
  const [landSizeMax, setLandSizeMax] = useState<number | "">(existing?.land_size_max ?? "");

  // Property Features
  const [lifestyle, setLifestyle] = useState<string[]>(existing?.lifestyle ?? []);
  const [features, setFeatures] = useState<string[]>(existing?.features ?? []);
  const [architect, setArchitect] = useState(existing?.architect ?? "");
  const [interiors, setInteriors] = useState(existing?.interiors ?? "");
  const [landscape, setLandscape] = useState(existing?.landscape ?? "");
  const [builder, setBuilder] = useState(existing?.builder ?? "");

  // Nearby Amenities
  const [nearbyAmenities, setNearbyAmenities] = useState<string[]>(
    existing?.nearby_amenities ?? []
  );

  // Selling Agent
  const [agentName, setAgentName] = useState(existing?.agent_name ?? "");
  const [agentPhone, setAgentPhone] = useState(existing?.agent_phone ?? "");
  const [agentEmail, setAgentEmail] = useState(existing?.agent_email ?? "");
  const [agentAgency, setAgentAgency] = useState(existing?.agent_agency ?? "");

  // Uploads
  const [heroImageUrl, setHeroImageUrl] = useState(existing?.hero_image_url ?? "");
  const [brochureUrl, setBrochureUrl] = useState(existing?.brochure_url ?? "");
  const [videoUrl, setVideoUrl] = useState(existing?.video_url ?? "");

  // Optional Uploads
  const [virtualTourUrl, setVirtualTourUrl] = useState(existing?.virtual_tour_url ?? "");
  const [gallery, setGallery] = useState<GalleryImage[]>(initialGallery);

  // Mini Stocklist
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>(initialFloorPlans);

  // SEO
  const [seoTitle, setSeoTitle] = useState(existing?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(existing?.seo_description ?? "");

  // Form meta
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function n(v: number | ""): number | null {
    return v === "" ? null : v;
  }

  function toggleLifestyle(item: string) {
    setLifestyle((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  }

  // ─── Gallery handlers ────────────────────────────────────────────────────

  async function addGalleryImage(url: string) {
    if (!url) return;
    const res = await fetch("/api/admin/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ development_id: id, url, sort_order: gallery.length }),
    });
    if (res.ok) {
      const json = await res.json();
      setGallery((prev) => [...prev, { id: json.id, url, sort_order: gallery.length }]);
    }
  }

  async function removeGalleryImage(imageId: string) {
    await fetch("/api/admin/gallery", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: imageId }),
    });
    setGallery((prev) => prev.filter((g) => g.id !== imageId));
  }

  // ─── Floor plan handlers ─────────────────────────────────────────────────

  function addFloorPlan() {
    setFloorPlans((prev) => [
      ...prev,
      { plan_type: "", config: "", internal_sqm: "", price_from: "", image_url: "" },
    ]);
  }

  function removeFloorPlan(index: number) {
    setFloorPlans((prev) => prev.filter((_, i) => i !== index));
  }

  function updateFloorPlan(index: number, field: keyof FloorPlan, value: string) {
    setFloorPlans((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      _method: isNew ? "POST" : "PATCH",
      id: isNew ? undefined : id,
      // Category
      type: type || null,
      tag: tag || null,
      tier: tier || null,
      // Project Overview
      name,
      slug,
      developer_id: developerId || null,
      suburb: suburb || null,
      state: state || null,
      status,
      summary: summary || null,
      is_published: isPublished,
      is_featured: isFeatured,
      lat: n(lat),
      lng: n(lng),
      // Configuration
      beds_min: n(bedsMin),
      beds_max: n(bedsMax),
      baths_min: n(bathsMin),
      baths_max: n(bathsMax),
      cars_min: n(carsMin),
      cars_max: n(carsMax),
      price_display: priceDisplay || null,
      price_from: n(priceFrom),
      completion_quarter: completionQuarter || null,
      levels: n(levels),
      residence_count: n(residenceCount),
      internal_sqm_min: n(internalSqmMin),
      internal_sqm_max: n(internalSqmMax),
      land_size_min: n(landSizeMin),
      land_size_max: n(landSizeMax),
      // Features
      lifestyle: lifestyle.length ? lifestyle : null,
      features: features.length ? features : null,
      architect: architect || null,
      interiors: interiors || null,
      landscape: landscape || null,
      builder: builder || null,
      // Amenities
      nearby_amenities: nearbyAmenities.length ? nearbyAmenities : null,
      // Agent
      agent_name: agentName || null,
      agent_phone: agentPhone || null,
      agent_email: agentEmail || null,
      agent_agency: agentAgency || null,
      // Uploads
      hero_image_url: heroImageUrl || null,
      brochure_url: brochureUrl || null,
      video_url: videoUrl || null,
      virtual_tour_url: virtualTourUrl || null,
      // SEO
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      // Floor plans
      floor_plans: floorPlans,
    };

    const res = await fetch("/api/admin/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Something went wrong. Please try again.");
      setSaving(false);
      return;
    }

    router.push("/admin/listings");
    router.refresh();
  }

  async function handleDelete() {
    if (
      !confirm(
        `Are you sure you want to delete "${existing?.name ?? "this listing"}"? This cannot be undone.`
      )
    )
      return;
    setDeleting(true);
    const res = await fetch("/api/admin/listings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Delete failed.");
      setDeleting(false);
      return;
    }
    router.push("/admin/listings");
    router.refresh();
  }

  // ─── Shared styles ────────────────────────────────────────────────────────

  const input =
    "w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md text-ink outline-none focus:border-orange/60 transition-colors";
  const label = "section-label block mb-1.5";
  const grid2 = "grid grid-cols-2 gap-4";
  const grid4 = "grid grid-cols-4 gap-4";

  const smallInput =
    "w-full border border-line px-2 py-1.5 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 transition-colors";

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      <Link
        href="/admin/listings"
        className="inline-flex items-center gap-1.5 font-mono text-label-sm uppercase tracking-widest text-ink/40 hover:text-orange transition-colors mb-6"
      >
        ← Back to Listings
      </Link>

      <h1 className="font-display font-light text-navy text-section-lg mb-8">
        {isNew ? "New listing" : `Edit: ${existing?.name}`}
      </h1>

      {error && (
        <p className="mb-6 font-sans text-body-md text-red-600 bg-red-50 border border-red-200 px-4 py-3">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-3xl">

        {/* ── 1. Category ─────────────────────────────────────────────────── */}
        <AccordionSection title="Category" defaultOpen>
          <div className={grid2}>
            <div>
              <label className={label}>Listing Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={input + " cursor-pointer"}
              >
                <option value="">— Select type —</option>
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Tag</label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g. New Release"
                className={input}
              />
            </div>
            <div>
              <label className={label}>Tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className={input + " cursor-pointer"}
              >
                <option value="">— No tier —</option>
                <option value="1st Tier">1st Tier</option>
                <option value="2nd Tier">2nd Tier</option>
              </select>
            </div>
          </div>
        </AccordionSection>

        {/* ── 2. Project Overview ──────────────────────────────────────────── */}
        <AccordionSection title="Project Overview" defaultOpen={isNew}>
          <div className={`${grid2} mb-4`}>
            <div>
              <label className={label}>Project Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={input}
              />
            </div>
            <div>
              <label className={label}>Slug *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className={input + " font-mono text-label-lg"}
              />
            </div>
            <div>
              <label className={label}>Developer</label>
              <select
                value={developerId}
                onChange={(e) => setDeveloperId(e.target.value)}
                className={input + " cursor-pointer"}
              >
                <option value="">— No developer —</option>
                {developers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={input + " cursor-pointer"}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Suburb</label>
              <input
                type="text"
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                className={input}
              />
            </div>
            <div>
              <label className={label}>State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className={input + " cursor-pointer"}
              >
                <option value="">Select</option>
                {STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Latitude</label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. -31.9344"
                className={input}
              />
            </div>
            <div>
              <label className={label}>Longitude</label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 115.7908"
                className={input}
              />
            </div>
          </div>
          <p className="font-sans text-xs text-ink/40 mb-4">
            Tip: right-click any location in Google Maps → copy the coordinates shown at the top.
          </p>
          <div className="mb-5">
            <label className={label}>Summary / Description</label>
            <textarea
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className={input + " resize-none"}
            />
          </div>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 accent-orange"
              />
              <span className="section-label">Published (visible on site)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 accent-orange"
              />
              <span className="section-label">Featured on homepage</span>
            </label>
          </div>
        </AccordionSection>

        {/* ── 3. Configuration Summary ─────────────────────────────────────── */}
        <AccordionSection title="Configuration Summary">
          <div className={`${grid4} mb-4`}>
            <div>
              <label className={label}>Beds Min</label>
              <input type="number" value={bedsMin} onChange={(e) => setBedsMin(e.target.value === "" ? "" : Number(e.target.value))} className={input} />
            </div>
            <div>
              <label className={label}>Beds Max</label>
              <input type="number" value={bedsMax} onChange={(e) => setBedsMax(e.target.value === "" ? "" : Number(e.target.value))} className={input} />
            </div>
            <div>
              <label className={label}>Baths Min</label>
              <input type="number" value={bathsMin} onChange={(e) => setBathsMin(e.target.value === "" ? "" : Number(e.target.value))} className={input} />
            </div>
            <div>
              <label className={label}>Baths Max</label>
              <input type="number" value={bathsMax} onChange={(e) => setBathsMax(e.target.value === "" ? "" : Number(e.target.value))} className={input} />
            </div>
            <div>
              <label className={label}>Car Parks Min</label>
              <input type="number" value={carsMin} onChange={(e) => setCarsMin(e.target.value === "" ? "" : Number(e.target.value))} className={input} />
            </div>
            <div>
              <label className={label}>Car Parks Max</label>
              <input type="number" value={carsMax} onChange={(e) => setCarsMax(e.target.value === "" ? "" : Number(e.target.value))} className={input} />
            </div>
            <div>
              <label className={label}>Internal Sqm Min</label>
              <input type="number" value={internalSqmMin} onChange={(e) => setInternalSqmMin(e.target.value === "" ? "" : Number(e.target.value))} className={input} />
            </div>
            <div>
              <label className={label}>Internal Sqm Max</label>
              <input type="number" value={internalSqmMax} onChange={(e) => setInternalSqmMax(e.target.value === "" ? "" : Number(e.target.value))} className={input} />
            </div>
            <div>
              <label className={label}>Land Size Min (sqm)</label>
              <input type="number" value={landSizeMin} onChange={(e) => setLandSizeMin(e.target.value === "" ? "" : Number(e.target.value))} className={input} />
            </div>
            <div>
              <label className={label}>Land Size Max (sqm)</label>
              <input type="number" value={landSizeMax} onChange={(e) => setLandSizeMax(e.target.value === "" ? "" : Number(e.target.value))} className={input} />
            </div>
          </div>
          <div className={grid2}>
            <div>
              <label className={label}>Price Display</label>
              <input type="text" value={priceDisplay} onChange={(e) => setPriceDisplay(e.target.value)} placeholder="e.g. From $750K" className={input} />
            </div>
            <div>
              <label className={label}>Price From ($)</label>
              <input type="number" value={priceFrom} onChange={(e) => setPriceFrom(e.target.value === "" ? "" : Number(e.target.value))} className={input} />
            </div>
            <div>
              <label className={label}>Completion</label>
              <input type="text" value={completionQuarter} onChange={(e) => setCompletionQuarter(e.target.value)} placeholder="e.g. Q4 2027" className={input} />
            </div>
            <div>
              <label className={label}>Levels</label>
              <input type="number" value={levels} onChange={(e) => setLevels(e.target.value === "" ? "" : Number(e.target.value))} className={input} />
            </div>
            <div>
              <label className={label}>Total Residences</label>
              <input type="number" value={residenceCount} onChange={(e) => setResidenceCount(e.target.value === "" ? "" : Number(e.target.value))} className={input} />
            </div>
          </div>
        </AccordionSection>

        {/* ── 4. Property Features ─────────────────────────────────────────── */}
        <AccordionSection title="Property Features">
          <div className="mb-6">
            <label className={label}>Lifestyle &amp; Amenities</label>
            <div className="grid grid-cols-3 gap-y-3 gap-x-2 mt-2">
              {LIFESTYLE_OPTIONS.map((item) => (
                <label key={item} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lifestyle.includes(item)}
                    onChange={() => toggleLifestyle(item)}
                    className="w-4 h-4 accent-orange flex-shrink-0"
                  />
                  <span className="font-sans text-sm text-ink/80">{item}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <label className={label}>Additional Features</label>
            <p className="font-sans text-xs text-ink/40 mb-2">Type a feature and press Enter.</p>
            <TagInput value={features} onChange={setFeatures} placeholder="e.g. Ducted AC" />
          </div>
          <div className={grid2}>
            <div>
              <label className={label}>Architect</label>
              <input type="text" value={architect} onChange={(e) => setArchitect(e.target.value)} className={input} />
            </div>
            <div>
              <label className={label}>Interior Designer</label>
              <input type="text" value={interiors} onChange={(e) => setInteriors(e.target.value)} className={input} />
            </div>
            <div>
              <label className={label}>Landscape Designer</label>
              <input type="text" value={landscape} onChange={(e) => setLandscape(e.target.value)} className={input} />
            </div>
            <div>
              <label className={label}>Builder</label>
              <input type="text" value={builder} onChange={(e) => setBuilder(e.target.value)} className={input} />
            </div>
          </div>
        </AccordionSection>

        {/* ── 5. Nearby Amenities ──────────────────────────────────────────── */}
        <AccordionSection title="Nearby Amenities">
          <p className="font-sans text-xs text-ink/40 mb-3">
            Add schools, transport, shopping centres, parks — anything nearby.
          </p>
          <TagInput
            value={nearbyAmenities}
            onChange={setNearbyAmenities}
            placeholder="e.g. Melbourne Central Station"
          />
        </AccordionSection>

        {/* ── 6. Selling Agent(s) / Contact Details ────────────────────────── */}
        <AccordionSection title="Selling Agent(s) / Contact Details">
          <div className={grid2}>
            <div>
              <label className={label}>Agent Name</label>
              <input type="text" value={agentName} onChange={(e) => setAgentName(e.target.value)} className={input} />
            </div>
            <div>
              <label className={label}>Agency</label>
              <input type="text" value={agentAgency} onChange={(e) => setAgentAgency(e.target.value)} className={input} />
            </div>
            <div>
              <label className={label}>Phone</label>
              <input type="tel" value={agentPhone} onChange={(e) => setAgentPhone(e.target.value)} className={input} />
            </div>
            <div>
              <label className={label}>Email</label>
              <input type="email" value={agentEmail} onChange={(e) => setAgentEmail(e.target.value)} className={input} />
            </div>
          </div>
        </AccordionSection>

        {/* ── 7. Uploads ───────────────────────────────────────────────────── */}
        <AccordionSection title="Uploads">
          <div className="mb-6">
            <ImageUpload
              label="Hero Image"
              value={heroImageUrl}
              onChange={setHeroImageUrl}
              bucket="development-images"
            />
          </div>
          <div className={grid2}>
            <div>
              <label className={label}>Brochure URL</label>
              <input
                type="url"
                value={brochureUrl}
                onChange={(e) => setBrochureUrl(e.target.value)}
                placeholder="https://..."
                className={input}
              />
            </div>
            <div>
              <label className={label}>Video URL</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                className={input}
              />
            </div>
          </div>
        </AccordionSection>

        {/* ── 8. Optional Uploads ──────────────────────────────────────────── */}
        <AccordionSection title="Optional Uploads">
          <div className="mb-6">
            <label className={label}>Virtual Tour URL</label>
            <input
              type="url"
              value={virtualTourUrl}
              onChange={(e) => setVirtualTourUrl(e.target.value)}
              placeholder="https://..."
              className={input}
            />
          </div>
          {isNew ? (
            <p className="font-sans text-sm text-ink/40 italic">
              Save the listing first to add gallery images.
            </p>
          ) : (
            <GalleryManager
              gallery={gallery}
              onAdd={addGalleryImage}
              onRemove={removeGalleryImage}
            />
          )}
        </AccordionSection>

        {/* ── 9. Mini Stocklist (Optional) ─────────────────────────────────── */}
        <AccordionSection title="Mini Stocklist (Optional)">
          {isNew ? (
            <p className="font-sans text-sm text-ink/40 italic">
              Save the listing first to add floor plans.
            </p>
          ) : (
            <div>
              {floorPlans.length > 0 && (
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-left border border-line">
                    <thead>
                      <tr className="border-b border-orange/30 bg-cream-alt">
                        {["Plan Type", "Config", "Sqm", "Price From ($)", "Image URL", ""].map(
                          (h) => (
                            <th
                              key={h}
                              className="font-mono text-[10px] uppercase tracking-widest text-orange px-3 py-2 whitespace-nowrap"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {floorPlans.map((fp, i) => (
                        <tr key={i} className="border-b border-line last:border-0">
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={fp.plan_type}
                              onChange={(e) => updateFloorPlan(i, "plan_type", e.target.value)}
                              placeholder="Type A"
                              className={smallInput + " w-24"}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={fp.config}
                              onChange={(e) => updateFloorPlan(i, "config", e.target.value)}
                              placeholder="2 bed 2 bath"
                              className={smallInput + " w-32"}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={fp.internal_sqm}
                              onChange={(e) => updateFloorPlan(i, "internal_sqm", e.target.value)}
                              placeholder="85"
                              className={smallInput + " w-20"}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={fp.price_from}
                              onChange={(e) => updateFloorPlan(i, "price_from", e.target.value)}
                              placeholder="750000"
                              className={smallInput + " w-28"}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={fp.image_url}
                              onChange={(e) => updateFloorPlan(i, "image_url", e.target.value)}
                              placeholder="https://..."
                              className={smallInput + " w-48"}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() => removeFloorPlan(i)}
                              className="font-mono text-[10px] uppercase tracking-widest px-2 py-1.5 border border-red-300 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors whitespace-nowrap"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <button
                type="button"
                onClick={addFloorPlan}
                className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-line text-ink/60 hover:border-navy hover:text-navy transition-colors"
              >
                + Add Floor Plan
              </button>
            </div>
          )}
        </AccordionSection>

        {/* ── 10. SEO ──────────────────────────────────────────────────────── */}
        <AccordionSection title="SEO">
          <div className="flex flex-col gap-4">
            <div>
              <label className={label}>SEO Title</label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="e.g. Luxury Apartments in Melbourne CBD | ProjectName"
                className={input}
              />
            </div>
            <div>
              <label className={label}>SEO Description</label>
              <textarea
                rows={3}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="150–160 character description for search engines…"
                className={input + " resize-none"}
              />
              <p className="font-mono text-label-sm text-ink/30 mt-1">
                {seoDescription.length} / 160 chars
              </p>
            </div>
          </div>
        </AccordionSection>

        {/* ── Form actions ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex gap-3">
            <button type="submit" disabled={saving || deleting} className="btn-primary">
              {saving ? "Saving…" : isNew ? "Create listing" : "Save changes"}
            </button>
            <Link href="/admin/listings" className="btn-ghost">
              Cancel
            </Link>
          </div>
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="font-mono text-label-sm uppercase tracking-widest px-4 py-2 border border-red-300 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete listing"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
