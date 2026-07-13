"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/features/admin/components/image-upload";
import { RichTextEditor } from "@/features/admin/components/rich-text-editor";
import { featuresForCategory } from "@/features/listings/category-features";
import { getCardFields, getStocklistFields } from "@/lib/listing-card-fields";
import { categorySlug } from "@/lib/listing-url";
import type { Agent, GalleryImage, FloorPlan, MiniStocklistEntry, Developer, Member, ListingData } from "@/features/listings/admin-form/types";
import { buildPayload } from "@/features/listings/admin-form/build-payload";
import { useListingFormState } from "@/features/listings/admin-form/use-listing-form-state";
import { AccordionSection } from "@/features/listings/admin-form/fields/accordion-section";
import { SectionDivider } from "@/features/listings/admin-form/fields/section-divider";
import { ExampleHint } from "@/features/listings/admin-form/fields/example-hint";
import { CardPreview } from "@/features/listings/admin-form/fields/card-preview";
import { TagInput } from "@/features/listings/admin-form/fields/tag-input";
import { AddYourOwn } from "@/features/listings/admin-form/fields/add-your-own";
import { SingleUpload } from "@/features/listings/admin-form/fields/single-upload";
import { AgentManager } from "@/features/listings/admin-form/managers/agent-manager";
import { GalleryManager } from "@/features/listings/admin-form/managers/gallery-manager";

// ─── Types ───────────────────────────────────────────────────────────────────

const MAX_STOCKLIST_ROWS = 20;
const MAX_CONFIG_SUMMARY_ROWS = 4;

interface Props {
  id: string;
  existing?: ListingData;
  developers: Developer[];
  members: Member[];
  gallery: GalleryImage[];
  floorPlans: FloorPlan[];
  agents: Omit<Agent, "isNew" | "saving" | "deleting">[];
  isPortal?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const AU_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

// Canonical listing taxonomy — matches the public site + portal. The admin
// form and the portal form both use this one list (was previously a separate
// legacy set: Apartment / Townhouse / Villa / Land / Mixed Use).
const PORTAL_TYPES = [
  "New Apartments", "Townhouses", "Land and Estates",
  "Commercial", "House & Land",
  "Over 55's / Retirement",
];

const STATUSES = [
  "Selling now", "Final release", "Register interest", "Cancelled", "Archived",
];

const LISTING_DURATIONS = ["3 Months", "6 Months", "12 Months", "24 Months"];

// ─── Main Form ───────────────────────────────────────────────────────────────

export function ListingForm({
  id,
  existing,
  developers,
  members,
  gallery: initialGallery,
  floorPlans: initialFloorPlans,
  agents,
  isPortal = false,
}: Props) {
  const router = useRouter();
  const isNew = id === "new";

  // All form field state, grouped into section slices. Collections that rely
  // on functional updates (lifestyle, gallery, floorPlans, miniStocklist)
  // are exposed under state.rows.* with raw setter passthroughs.
  const { state, set, setLifestyle, setGallery, setFloorPlans, setMiniStocklist } =
    useListingFormState(existing, initialGallery, initialFloorPlans);

  // Form meta
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function toggleLifestyle(item: string) {
    setLifestyle((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  }

  // ─── Gallery ─────────────────────────────────────────────────────────────

  async function addGalleryImage(url: string) {
    if (!url) return;
    const res = await fetch("/api/admin/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ development_id: id, url, sort_order: state.rows.gallery.length }),
    });
    if (res.ok) {
      const json = await res.json();
      setGallery((prev) => [...prev, { id: json.id, url, sort_order: state.rows.gallery.length }]);
    }
  }

  function reorderGallery(reordered: GalleryImage[]) {
    setGallery(reordered);
  }

  async function removeGalleryImage(imageId: string) {
    await fetch("/api/admin/gallery", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: imageId }),
    });
    setGallery((prev) => prev.filter((g) => g.id !== imageId));
  }

  // ─── Floor plans ─────────────────────────────────────────────────────────

  function addFloorPlan() {
    setFloorPlans((prev) =>
      prev.length >= MAX_CONFIG_SUMMARY_ROWS
        ? prev
        : [...prev, { beds: "", bath: "", garage: "", internal_sqm: "", price_from: "", plan_type: "", config: "", image_url: "", lot_number: "", land_area_sqm: "", frontage_m: "", depth_m: "", house_size_sqm: "", land_size_sqm: "", floor_area_sqm: "", level: "", unit_suite_no: "", property_sub_type: "" }],
    );
  }

  function removeFloorPlan(index: number) {
    setFloorPlans((prev) => prev.filter((_, i) => i !== index));
  }

  function updateFloorPlan(index: number, field: keyof FloorPlan, value: string) {
    setFloorPlans((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  }

  // ─── Mini Stocklist (Properties Available) ────────────────────────────────

  function addStocklistRow() {
    setMiniStocklist((prev) =>
      prev.length >= MAX_STOCKLIST_ROWS
        ? prev
        : [...prev, { bed: "", bath: "", parking: "", size: "", price: "", lot_number: "", land_area: "", frontage: "", depth: "", house_size: "", land_size: "", floor_area: "", level: "", unit_suite_no: "", property_sub_type: "" }],
    );
  }

  function removeStocklistRow(index: number) {
    setMiniStocklist((prev) => prev.filter((_, i) => i !== index));
  }

  function updateStocklistRow(index: number, field: keyof MiniStocklistEntry, value: string) {
    setMiniStocklist((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  // All payload-relevant field state, assembled once per render and fed to
  // the extracted buildPayload() (features/listings/admin-form/build-payload).
  const payloadState = {
    isNew,
    id,
    type: state.category.type,
    tier: state.category.tier,
    name: state.overview.name,
    slug: state.overview.slug,
    developerId: state.overview.developerId,
    portalDeveloperName: state.overview.portalDeveloperName,
    ownerUserId: state.overview.ownerUserId,
    developerWebsite: state.overview.developerWebsite,
    listingDuration: state.overview.listingDuration,
    logoUrl: state.overview.logoUrl,
    residenceCount: state.overview.residenceCount,
    streetAddress: state.address.streetAddress,
    streetAddress2: state.address.streetAddress2,
    country: state.address.country,
    state: state.address.state,
    city: state.address.city,
    postcode: state.address.postcode,
    suburb: state.address.suburb,
    locationDescription: state.address.locationDescription,
    saleOfficeStreet: state.saleOffice.saleOfficeStreet,
    saleOfficeStreet2: state.saleOffice.saleOfficeStreet2,
    saleOfficeCountry: state.saleOffice.saleOfficeCountry,
    saleOfficeState: state.saleOffice.saleOfficeState,
    saleOfficeCity: state.saleOffice.saleOfficeCity,
    saleOfficePostcode: state.saleOffice.saleOfficePostcode,
    displaySuiteTiming: state.details.displaySuiteTiming,
    description: state.details.description,
    status: state.details.status,
    isPublished: state.details.isPublished,
    isFeatured: state.details.isFeatured,
    lat: state.details.lat,
    lng: state.details.lng,
    priceFrom: state.pricing.priceFrom,
    searchPriceMax: state.pricing.searchPriceMax,
    priceDisplay: state.pricing.priceDisplay,
    showPriceOnSearch: state.pricing.showPriceOnSearch,
    promotionalBanner: state.pricing.promotionalBanner,
    completionQuarter: state.pricing.completionQuarter,
    configurationLabel: state.pricing.configurationLabel,
    bedsMin: state.config.bedsMin,
    bedsMax: state.config.bedsMax,
    bathsMin: state.config.bathsMin,
    bathsMax: state.config.bathsMax,
    carsMin: state.config.carsMin,
    carsMax: state.config.carsMax,
    levels: state.config.levels,
    internalSqmMin: state.config.internalSqmMin,
    internalSqmMax: state.config.internalSqmMax,
    landSizeMin: state.config.landSizeMin,
    landSizeMax: state.config.landSizeMax,
    lifestyle: state.rows.lifestyle,
    features: state.features.features,
    architect: state.features.architect,
    interiors: state.features.interiors,
    landscape: state.features.landscape,
    builder: state.features.builder,
    nearbyAmenities: state.amenities.nearbyAmenities,
    agentName: state.agent.agentName,
    agentPhone: state.agent.agentPhone,
    agentEmail: state.agent.agentEmail,
    agentAgency: state.agent.agentAgency,
    heroImageUrl: state.uploads.heroImageUrl,
    heroAltText: state.uploads.heroAltText,
    featureImageUrl: state.uploads.featureImageUrl,
    brochureUrl: state.uploads.brochureUrl,
    videoUrl: state.uploads.videoUrl,
    agentLogo1: state.uploads.agentLogo1,
    agentLogo2: state.uploads.agentLogo2,
    virtualTourUrl: state.uploads.virtualTourUrl,
    floorPlanUploadUrl: state.uploads.floorPlanUploadUrl,
    additionalVideoUrl: state.uploads.additionalVideoUrl,
    priceListUrl: state.uploads.priceListUrl,
    specificationsUrl: state.uploads.specificationsUrl,
    seoTitle: state.seo.seoTitle,
    seoDescription: state.seo.seoDescription,
    floorPlans: state.rows.floorPlans,
    miniStocklist: state.rows.miniStocklist,
  };

  // ── Autosave (2026-07-02) ──────────────────────────────────────────────
  // Compute a fingerprint of the current form state on every render. Then a
  // debounced effect (below) checks if it has drifted from what's on the
  // server and silently PATCHes if so. This preserves in-progress work when
  // a member starts a listing, wanders off to another tab, and comes back.
  //
  // Uses the same /api/admin/listings endpoint as the explicit Save button;
  // just doesn't redirect afterwards. Errors are logged and shown as a small
  // "Save failed" hint next to the Save button — they don't block the form.
  //
  // Skipped for new listings (isNew) because there's no id to PATCH yet;
  // the draft-first flow means the edit page always has an id anyway.
  const currentFingerprint = JSON.stringify(buildPayload(payloadState));
  const lastSavedFingerprintRef = useRef<string>("");
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  // Track the mounted-since-render timestamp so we can skip the initial
  // "state is identical to props" state and only autosave real user changes.
  const mountedRef = useRef(false);

  useEffect(() => {
    // On first render, seed the ref with the initial fingerprint so we
    // don't autosave the untouched form.
    if (!mountedRef.current) {
      lastSavedFingerprintRef.current = currentFingerprint;
      mountedRef.current = true;
      return;
    }
    if (isNew || saving) return;
    if (currentFingerprint === lastSavedFingerprintRef.current) return;

    const timer = setTimeout(async () => {
      setAutoSaveStatus("saving");
      try {
        const res = await fetch("/api/admin/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: currentFingerprint,
        });
        if (!res.ok) {
          setAutoSaveStatus("error");
          return;
        }
        lastSavedFingerprintRef.current = currentFingerprint;
        setAutoSaveStatus("saved");
        // Fade the "Saved" pill back to idle after a moment so it doesn't
        // sit there stale after inactivity.
        setTimeout(() => setAutoSaveStatus("idle"), 2500);
      } catch (err) {
        console.error("Autosave failed:", err);
        setAutoSaveStatus("error");
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [currentFingerprint, isNew, saving]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = buildPayload(payloadState);

    const res = await fetch("/api/admin/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Something went wrong. Please try again.");
      setSaving(false);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Mark the current state as saved so the autosave doesn't immediately
    // fire again right before we navigate away.
    lastSavedFingerprintRef.current = JSON.stringify(payload);

    router.push(isPortal ? "/portal/listings" : "/admin/listings");
    router.refresh();
  }

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Floor plan delete confirmation (portal only)
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);
  const [floorPlanDeleteText, setFloorPlanDeleteText] = useState("");

  async function handleDelete() {
    setShowDeleteModal(false);
    setDeleteConfirmText("");
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
    router.push(isPortal ? "/portal/listings" : "/admin/listings");
    router.refresh();
  }

  // ─── Shared styles ────────────────────────────────────────────────────────

  const inp = "w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md text-ink outline-none focus:border-orange/60 transition-colors";
  const lbl = "section-label block mb-1.5";
  const g2 = "grid grid-cols-2 gap-4";
  const g3 = "grid grid-cols-3 gap-4";
  const g4 = "grid grid-cols-4 gap-4";
  const g5 = "grid grid-cols-5 gap-4";
  const smallInp = "w-full border border-line px-2 py-1.5 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 transition-colors";

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      <Link
        href={isPortal ? "/portal/listings" : "/admin/listings"}
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">

        {/* ── Subscribe & publish (portal only) ──────────────────────────────
            The only payment entry point. Enabled once the mandatory fields
            (name + suburb + state — what the API requires) are filled. Paying
            publishes the listing via the Stripe webhook. */}
        {isPortal && (
          existing?.subscription_status === "active" ? (
            <div className="mb-1 rounded-md border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-sm font-semibold text-green-800">✓ Subscription active — your listing is live</p>
              <p className="text-xs text-green-700 mt-0.5">Billed $299/month + GST. To cancel, please contact us.</p>
            </div>
          ) : (
            <div className="mb-1 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold" style={{ color: "#1a2340" }}>Publish this listing</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {state.overview.name.trim() && state.address.suburb.trim() && state.address.state.trim()
                    ? "Subscribe to publish your listing — $299/month + GST. You can keep editing anytime."
                    : "Fill in Project Name, Suburb and State to enable publishing."}
                </p>
              </div>
              {state.overview.name.trim() && state.address.suburb.trim() && state.address.state.trim() ? (
                <a
                  href={`/api/stripe/checkout?tier=agency_listing&project=${id}`}
                  className="shrink-0 text-center py-2.5 px-6 text-xs font-bold uppercase tracking-widest text-white rounded transition-opacity hover:opacity-80"
                  style={{ background: "#e85d26" }}
                >
                  Subscribe &amp; Publish
                </a>
              ) : (
                <span
                  aria-disabled="true"
                  title="Fill in Project Name, Suburb and State first"
                  className="shrink-0 text-center py-2.5 px-6 text-xs font-bold uppercase tracking-widest text-white rounded opacity-40 cursor-not-allowed"
                  style={{ background: "#e85d26" }}
                >
                  Subscribe &amp; Publish
                </span>
              )}
            </div>
          )
        )}

        {/* ── 1. Category ─────────────────────────────────────────────────── */}
        <AccordionSection title="Category" defaultOpen>
          <div className={g2}>
            <div>
              <label className={lbl}>Listing Type</label>
              <select value={state.category.type} onChange={(e) => set.category({ type: e.target.value })} className={inp + " cursor-pointer"}>
                <option value="">— Select type —</option>
                {/* One canonical taxonomy everywhere. If this listing was saved
                    with a legacy value not in the list (e.g. "Land", "Villa",
                    "Mixed Use"), keep showing it so the value isn't silently
                    wiped — re-selecting a proper name canonicalises it. */}
                {(!state.category.type || PORTAL_TYPES.includes(state.category.type) ? PORTAL_TYPES : [state.category.type, ...PORTAL_TYPES]).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {!isPortal && (
              <div>
                <label className={lbl}>Tier</label>
                <select value={state.category.tier} onChange={(e) => set.category({ tier: e.target.value })} className={inp + " cursor-pointer"}>
                  <option value="">— No tier —</option>
                  <option value="1st Tier">1st Tier</option>
                  <option value="2nd Tier">2nd Tier</option>
                </select>
                <p className="font-sans text-[11px] text-ink/40 mt-1 leading-relaxed">
                  <strong className="text-ink/60">1st Tier</strong> — featured carousel on the homepage.{" "}
                  <strong className="text-ink/60">2nd Tier</strong> — second homepage row.{" "}
                  <strong className="text-ink/60">No tier</strong> — listing appears in search results only.
                </p>
              </div>
            )}
          </div>
        </AccordionSection>

        {/* ── 2. Project Overview ──────────────────────────────────────────── */}
        <AccordionSection title="Project Overview" defaultOpen={isNew}>

          {/* Row 1: name + listing duration */}
          <div className={g2}>
            <div>
              <label className={lbl}>Project Name *</label>
              <input type="text" value={state.overview.name} onChange={(e) => set.overview({ name: e.target.value })} required className={inp} />
            </div>
            <div>
              <label className={lbl}>Listing Duration</label>
              <select value={state.overview.listingDuration} onChange={(e) => set.overview({ listingDuration: e.target.value })} className={inp + " cursor-pointer"}>
                <option value="">— Select —</option>
                {(isPortal ? ["6 Months", "12 Months"] : LISTING_DURATIONS).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: developer + website + number of residences */}
          <div className={`${g3} mt-4`}>
            <div>
              <label className={lbl}>Project By (Developer)</label>
              {isPortal ? (
                <input
                  type="text"
                  value={state.overview.portalDeveloperName}
                  onChange={(e) => set.overview({ portalDeveloperName: e.target.value })}
                  placeholder="e.g. ABC Developers Pty Ltd"
                  className={inp}
                />
              ) : (
                <select value={state.overview.developerId} onChange={(e) => set.overview({ developerId: e.target.value })} className={inp + " cursor-pointer"}>
                  <option value="">— No developer —</option>
                  {developers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className={lbl}>Developer Website URL</label>
              <input type="url" value={state.overview.developerWebsite} onChange={(e) => set.overview({ developerWebsite: e.target.value })} placeholder="https://..." className={inp} />
            </div>
            <div>
              <label className={lbl}>{state.category.type === "Townhouses" ? "Number of Homes" : "Number of Apartments / Lots"}</label>
              <input type="number" value={state.overview.residenceCount} onChange={(e) => set.overview({ residenceCount: e.target.value === "" ? "" : Number(e.target.value) })} className={inp} />
            </div>
          </div>

          {/* Row 3: assign to account — admin only */}
          {!isPortal && (
            <div className="mt-4">
              <label className={lbl}>Assign to Account <span className="normal-case font-sans text-ink/40 text-xs">(Developer or Agent account)</span></label>
              <select value={state.overview.ownerUserId} onChange={(e) => set.overview({ ownerUserId: e.target.value })} className={inp + " cursor-pointer"}>
                <option value="">— Unassigned —</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name ?? "Unnamed"} — {m.interest_type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Project logo */}
          <div className="mt-5">
            <ImageUpload label="Project Logo" value={state.overview.logoUrl} onChange={(v) => set.overview({ logoUrl: v })} bucket="development-images" />
          </div>

          {/* URL slug — admin only */}
          {!isPortal && (
            <div className="mt-4">
              <label className={lbl}>URL Slug *</label>
              <input type="text" value={state.overview.slug} onChange={(e) => set.overview({ slug: e.target.value })} required className={inp + " font-mono text-label-lg"} />
            </div>
          )}

          {/* ── Address ── */}
          <SectionDivider label="Address" />
          <div className={`${g4} mb-4`}>
            <div>
              <label className={lbl}>Street Address *</label>
              <input type="text" value={state.address.streetAddress} onChange={(e) => set.address({ streetAddress: e.target.value })} placeholder="e.g. 35" className={inp} />
            </div>
            <div>
              <label className={lbl}>Street Address 2 *</label>
              <input type="text" value={state.address.streetAddress2} onChange={(e) => set.address({ streetAddress2: e.target.value })} placeholder="e.g. Northumberland Road" className={inp} />
            </div>
            <div>
              <label className={lbl}>Suburb</label>
              <input type="text" value={state.address.suburb} onChange={(e) => set.address({ suburb: e.target.value })} className={inp} />
            </div>
            <div>
              <label className={lbl}>City</label>
              <input type="text" value={state.address.city} onChange={(e) => set.address({ city: e.target.value })} className={inp} />
            </div>
            <div>
              <label className={lbl}>State</label>
              <select value={state.address.state} onChange={(e) => set.address({ state: e.target.value })} className={inp + " cursor-pointer"}>
                <option value="">Select</option>
                {AU_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>PostCode</label>
              <input type="text" value={state.address.postcode} onChange={(e) => set.address({ postcode: e.target.value })} className={inp} />
            </div>
            <div>
              <label className={lbl}>Country</label>
              <input type="text" value={state.address.country} onChange={(e) => set.address({ country: e.target.value })} placeholder="Australia" className={inp} />
            </div>
          </div>
          <div>
            <label className={lbl}>Location Description</label>
            <textarea rows={3} value={state.address.locationDescription} onChange={(e) => set.address({ locationDescription: e.target.value })} className={inp + " resize-none"} />
          </div>

          {/* ── Sale Office Address ── */}
          <SectionDivider label="Sale Office Address (if different to above)" />
          <div className={g4}>
            <div>
              <label className={lbl}>Street Address</label>
              <input type="text" value={state.saleOffice.saleOfficeStreet} onChange={(e) => set.saleOffice({ saleOfficeStreet: e.target.value })} className={inp} />
            </div>
            <div>
              <label className={lbl}>Street Address 2</label>
              <input type="text" value={state.saleOffice.saleOfficeStreet2} onChange={(e) => set.saleOffice({ saleOfficeStreet2: e.target.value })} className={inp} />
            </div>
            <div>
              <label className={lbl}>City</label>
              <input type="text" value={state.saleOffice.saleOfficeCity} onChange={(e) => set.saleOffice({ saleOfficeCity: e.target.value })} className={inp} />
            </div>
            <div>
              <label className={lbl}>State</label>
              <select value={state.saleOffice.saleOfficeState} onChange={(e) => set.saleOffice({ saleOfficeState: e.target.value })} className={inp + " cursor-pointer"}>
                <option value="">Select</option>
                {AU_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>PostCode</label>
              <input type="text" value={state.saleOffice.saleOfficePostcode} onChange={(e) => set.saleOffice({ saleOfficePostcode: e.target.value })} className={inp} />
            </div>
            <div>
              <label className={lbl}>Country</label>
              <input type="text" value={state.saleOffice.saleOfficeCountry} onChange={(e) => set.saleOffice({ saleOfficeCountry: e.target.value })} placeholder="Australia" className={inp} />
            </div>
          </div>

          {/* ── Timing & Description ── */}
          <SectionDivider label="Listing Details" />
          <div className="mb-4">
            <label className={lbl}>Display Suite Timing</label>
            <textarea
              rows={2}
              value={state.details.displaySuiteTiming}
              onChange={(e) => set.details({ displaySuiteTiming: e.target.value })}
              placeholder="e.g. Monday to Sunday 10am – 6pm"
              className={inp + " resize-none"}
            />
          </div>
          <div className="mb-4">
            <label className={lbl}>Listing Description *</label>
            <RichTextEditor
              value={state.details.description}
              onChange={(v) => set.details({ description: v })}
              minHeight={260}
            />
            <p className="font-sans text-[11px] text-ink/40 mt-1">
              Use the toolbar to add bold, italic, headings, lists, links and images. Formatting will be preserved on the public listing page.
            </p>
          </div>

          {/* ── Pricing & dates ── */}
          <SectionDivider label="Pricing &amp; Dates" />
          <div className={`${g5} mb-4`}>
            <div>
              <label className={lbl}>Search Price Minimum ($) *</label>
              <input type="number" value={state.pricing.priceFrom} onChange={(e) => set.pricing({ priceFrom: e.target.value === "" ? "" : Number(e.target.value) })} placeholder="450000" className={inp} />
            </div>
            <div>
              <label className={lbl}>Search Price Maximum ($) *</label>
              <input type="number" value={state.pricing.searchPriceMax} onChange={(e) => set.pricing({ searchPriceMax: e.target.value === "" ? "" : Number(e.target.value) })} placeholder="1275000" className={inp} />
            </div>
            <div>
              <label className={lbl}>Completion Date *</label>
              <input type="text" value={state.pricing.completionQuarter} onChange={(e) => set.pricing({ completionQuarter: e.target.value })} placeholder="e.g. Q1 2028" className={inp} />
            </div>
            <div>
              <label className={lbl}>
                Lead In Pricing
                <ExampleHint title="Where Lead In Pricing appears">
                  <p>This is the headline price shown on the listing card on search results. Free-text, so you can write "From $650,000", "Contact Agent", "Auction", etc.</p>
                  <Image
                    src="/examples/lead-in-pricing.png"
                    alt="Example: where Lead In Pricing appears on the listing card"
                    width={1824}
                    height={681}
                    className="w-full h-auto border border-line rounded-sm"
                  />
                </ExampleHint>
              </label>
              <input type="text" value={state.pricing.priceDisplay} onChange={(e) => set.pricing({ priceDisplay: e.target.value })} placeholder="e.g. From $650,000" className={inp} />
            </div>
            {!isPortal && (
              <div>
                <label className={lbl}>Promotional Banner</label>
                <input type="text" value={state.pricing.promotionalBanner} onChange={(e) => set.pricing({ promotionalBanner: e.target.value })} placeholder="e.g. 2 BED FI $775,000" className={inp} />
              </div>
            )}
          </div>
          <div className="mb-4">
            <label className={lbl}>
              Configuration{" "}
              <span className="font-sans text-xs text-ink/40 font-normal">(max 25 characters)</span>
              <ExampleHint title="Where the Configuration label appears">
                <p>A short summary chip shown beneath the category badge on the listing card. Keep it under 25 characters so it fits without wrapping.</p>
                <Image
                  src="/examples/configuration.png"
                  alt="Example: where the Configuration label appears"
                  width={1294}
                  height={1045}
                  className="w-full h-auto border border-line rounded-sm"
                />
              </ExampleHint>
            </label>
            <input
              type="text"
              value={state.pricing.configurationLabel}
              onChange={(e) => set.pricing({ configurationLabel: e.target.value.slice(0, 25) })}
              placeholder="e.g. 1, 2 & 3 Bedrooms"
              maxLength={25}
              className={inp}
            />
            <p className="font-mono text-label-sm text-ink/30 mt-1">
              {state.pricing.configurationLabel.length} / 25 chars
            </p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input type="checkbox" checked={state.pricing.showPriceOnSearch} onChange={(e) => set.pricing({ showPriceOnSearch: e.target.checked })} className="w-4 h-4 accent-orange" />
            <span className="section-label">Display price on search results</span>
          </label>

          {/* ── Visibility ── admin only */}
          {!isPortal && (
            <>
              <SectionDivider label="Visibility &amp; Location" />
              <div className={`${g2} mb-4`}>
                <div>
                  <label className={lbl}>Status</label>
                  <select value={state.details.status} onChange={(e) => set.details({ status: e.target.value })} className={inp + " cursor-pointer"}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-3 mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={state.details.isPublished} onChange={(e) => set.details({ isPublished: e.target.checked })} className="w-4 h-4 accent-orange" />
                  <span className="section-label">Published (visible on site)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={state.details.isFeatured} onChange={(e) => set.details({ isFeatured: e.target.checked })} className="w-4 h-4 accent-orange" />
                  <span className="section-label">Featured on homepage</span>
                </label>
              </div>
              <div className={g2}>
                <div>
                  <label className={lbl}>Latitude</label>
                  <input type="number" step="any" value={state.details.lat} onChange={(e) => set.details({ lat: e.target.value === "" ? "" : Number(e.target.value) })} placeholder="e.g. -33.8688" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Longitude</label>
                  <input type="number" step="any" value={state.details.lng} onChange={(e) => set.details({ lng: e.target.value === "" ? "" : Number(e.target.value) })} placeholder="e.g. 151.2093" className={inp} />
                </div>
              </div>
              <p className="font-sans text-xs text-ink/40 mt-2">
                Tip: right-click any location in Google Maps → copy the coordinates shown at the top.
              </p>
            </>
          )}
        </AccordionSection>

        {/* ── 3. Team ──────────────────────────────────────────────────────── */}
        {/* Fields already existed in schema (developments.architect/interiors/
            builder) and in state + save payload — only the input UI was
            missing. Public listing renders these under the "Team" strip on
            /listings/[slug]. */}
        <AccordionSection title="Team">
          <div className={`${g3} mb-4`}>
            <div>
              <label className={lbl}>Architect</label>
              <input
                type="text"
                value={state.features.architect}
                onChange={(e) => set.features({ architect: e.target.value })}
                placeholder="e.g. CDArchitects"
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Interiors</label>
              <input
                type="text"
                value={state.features.interiors}
                onChange={(e) => set.features({ interiors: e.target.value })}
                placeholder="e.g. Richards Stanisich"
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Builder</label>
              <input
                type="text"
                value={state.features.builder}
                onChange={(e) => set.features({ builder: e.target.value })}
                placeholder="e.g. Multiplex"
                className={inp}
              />
            </div>
          </div>
        </AccordionSection>

        {/* ── 4. Configuration Summary ─────────────────────────────────────── */}
        <AccordionSection title="Configuration Summary">
          {isNew ? (
            <p className="font-sans text-sm text-ink/40 italic">Save the listing first to add unit configurations.</p>
          ) : (
            <div>
              <div className="mb-4 flex items-center">
                <p className="font-sans text-xs text-ink/50">
                  Up to 4 rows shown on the public listing card.
                </p>
                <ExampleHint title="Where Configuration Summary appears">
                  <p>Each row you add here becomes one line of the <strong>Properties Available</strong> stats strip on the listing card on search results.</p>
                  <p className="text-ink/50 text-xs">Max 4 rows — the card has space for 4 lines plus the price.</p>
                  <CardPreview highlight="summary" />
                </ExampleHint>
              </div>
              {state.rows.floorPlans.length > 0 && (() => {
                const cardFields = getCardFields(state.category.type);
                return (
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b-2 border-orange/20">
                          {cardFields.map((f) => (
                            <th key={f.key} className="font-sans text-sm font-semibold text-ink/70 px-4 py-3 whitespace-nowrap">{f.label}</th>
                          ))}
                          <th className="font-sans text-sm font-semibold text-ink/70 px-4 py-3 whitespace-nowrap">Price From ($)</th>
                          <th className="font-sans text-sm font-semibold text-ink/70 px-4 py-3 whitespace-nowrap">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.rows.floorPlans.map((fp, i) => (
                          <tr key={i} className="border-b border-line last:border-0">
                            {cardFields.map((f) => {
                              const cellValue = (fp[f.key as keyof FloorPlan] as string) ?? "";
                              const cellClass = `border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 ${f.inputWidth ?? "w-24"}`;
                              return (
                                <td key={f.key} className="px-4 py-3">
                                  {f.type === "select" ? (
                                    <select
                                      value={cellValue}
                                      onChange={(e) => updateFloorPlan(i, f.key as keyof FloorPlan, e.target.value)}
                                      className={`${cellClass} cursor-pointer`}
                                    >
                                      <option value="">{f.placeholder ?? "—"}</option>
                                      {f.options?.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type={f.type}
                                      value={cellValue}
                                      onChange={(e) => updateFloorPlan(i, f.key as keyof FloorPlan, e.target.value)}
                                      placeholder={f.placeholder}
                                      className={cellClass}
                                    />
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-4 py-3">
                              <input type="number" value={fp.price_from} onChange={(e) => updateFloorPlan(i, "price_from", e.target.value)} placeholder="650000" className="border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 w-32" />
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isPortal) {
                                    setFloorPlanDeleteText("");
                                    setPendingDeleteIndex(i);
                                  } else {
                                    removeFloorPlan(i);
                                  }
                                }}
                                className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-red-300 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
              <button
                type="button"
                onClick={addFloorPlan}
                disabled={state.rows.floorPlans.length >= MAX_CONFIG_SUMMARY_ROWS}
                className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors mr-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                + Add ({state.rows.floorPlans.length}/{MAX_CONFIG_SUMMARY_ROWS})
              </button>
              {state.rows.floorPlans.length >= MAX_CONFIG_SUMMARY_ROWS && (
                <p className="font-sans text-xs text-orange mt-2">
                  Maximum of {MAX_CONFIG_SUMMARY_ROWS} configurations reached. This is what shows on the public listing card.
                </p>
              )}
              <p className="font-sans text-xs text-ink/40 mt-3">
                Changes save when you click <strong>Save changes</strong> at the bottom of the form.
              </p>
            </div>
          )}
        </AccordionSection>

        {/* ── 3b. Properties Available (mini stocklist) ────────────────────
            Renders as the "Properties Available" table on the public
            listing page. Up to 20 rows per Tim's spec. All cells are
            free text so admins can mirror the existing site's mixed
            content (e.g. "Contact Agent" or "Fr. $660,000"). */}
        <AccordionSection title="Properties Available (Mini Stocklist)">
          <div>
            <p className="font-sans text-sm text-ink/60 mb-4">
              The longer per-unit availability table on the listing detail page.
              Restricted to {MAX_STOCKLIST_ROWS} rows. All fields accept free text —
              leave blank cells empty to show as "—" on the public table.
            </p>
            {state.rows.miniStocklist.length > 0 && (() => {
              const stockFields = getStocklistFields(state.category.type);
              return (
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b-2 border-orange/20">
                        {stockFields.map((f) => (
                          <th key={f.key} className="font-sans text-sm font-semibold text-ink/70 px-4 py-3 whitespace-nowrap">{f.label}</th>
                        ))}
                        <th className="font-sans text-sm font-semibold text-ink/70 px-4 py-3 whitespace-nowrap">Price From</th>
                        <th className="font-sans text-sm font-semibold text-ink/70 px-4 py-3 whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.rows.miniStocklist.map((r, i) => (
                        <tr key={i} className="border-b border-line last:border-0">
                          {stockFields.map((f) => {
                            const stockKey = (f.stocklistKey ?? f.key) as keyof MiniStocklistEntry;
                            const cellValue = (r[stockKey] as string | undefined) ?? "";
                            const cellClass = `border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 ${f.inputWidth ?? "w-24"}`;
                            return (
                              <td key={f.key} className="px-4 py-3">
                                {f.type === "select" ? (
                                  <select
                                    value={cellValue}
                                    onChange={(e) => updateStocklistRow(i, stockKey, e.target.value)}
                                    className={`${cellClass} cursor-pointer`}
                                  >
                                    <option value="">{f.placeholder ?? "—"}</option>
                                    {f.options?.map((opt) => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    value={cellValue}
                                    onChange={(e) => updateStocklistRow(i, stockKey, e.target.value)}
                                    placeholder={f.placeholder}
                                    className={cellClass}
                                  />
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-3">
                            <input type="text" value={r.price} onChange={(e) => updateStocklistRow(i, "price", e.target.value)} placeholder="$890,000 or Contact Agent" className="border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 w-56" />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => removeStocklistRow(i)}
                              className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-red-300 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
            <button
              type="button"
              onClick={addStocklistRow}
              disabled={state.rows.miniStocklist.length >= MAX_STOCKLIST_ROWS}
              className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors mr-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              + Add row ({state.rows.miniStocklist.length}/{MAX_STOCKLIST_ROWS})
            </button>
            <p className="font-sans text-xs text-ink/40 mt-3">
              Changes save when you click <strong>Save changes</strong> at the bottom of the form.
            </p>
          </div>
        </AccordionSection>

        {/* ── 4. Property Features ─────────────────────────────────────────── */}
        {/* The checklist below is derived from the currently selected
            Category (e.g. Commercial shows business-focused features like
            'Grease trap', 'Shop Front'; residential categories show
            'Fully Equipped Gym', 'BBQ Facilities' etc.). Mirrors the
            per-category taxonomy on the existing live admin. Any custom
            features the user added previously remain visible via
            AddYourOwn even if they're not in the current category's
            standard list. */}
        <AccordionSection title="Property Features">
          {(() => {
            const categoryFeatures = featuresForCategory(state.category.type);
            return (
              <>
                <p className="font-sans text-sm text-ink/50 mb-4">
                  ( At least select one property feature is required ){" "}
                  <span className="text-red-500">*</span>
                  {state.category.type && (
                    <span className="block text-xs text-ink/40 mt-1">
                      Showing the {state.category.type} feature set. Change the Category in
                      Section 1 to see a different list.
                    </span>
                  )}
                </p>
                <div className="grid grid-cols-3 gap-y-3 gap-x-4">
                  {categoryFeatures.map((item) => (
                    <label key={item} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.rows.lifestyle.includes(item)}
                        onChange={() => toggleLifestyle(item)}
                        className="w-4 h-4 accent-orange flex-shrink-0"
                      />
                      <span className="font-sans text-sm text-ink/80">{item}</span>
                    </label>
                  ))}
                </div>
                <AddYourOwn lifestyle={state.rows.lifestyle} setLifestyle={setLifestyle} standardOptions={categoryFeatures} />
              </>
            );
          })()}
        </AccordionSection>

        {/* ── 5. Nearby Amenities ──────────────────────────────────────────── */}
        <AccordionSection title="Nearby Amenities">
          <p className="font-sans text-xs text-ink/40 mb-3">
            Add schools, transport, shopping centres, parks — anything nearby.
          </p>
          <TagInput value={state.amenities.nearbyAmenities} onChange={(v) => set.amenities({ nearbyAmenities: v })} placeholder="e.g. Melbourne Central Station" />
        </AccordionSection>

        {/* ── 6. Selling Agent(s) / Contact Details ────────────────────────── */}
        <AccordionSection title="Selling Agent(s) / Contact Details">
          {isNew ? (
            <p className="font-sans text-sm text-ink/40 italic">
              Save the listing first to add selling agents.
            </p>
          ) : (
            <AgentManager developmentId={id} initialAgents={agents} />
          )}
        </AccordionSection>

        {/* ── 7. Uploads ───────────────────────────────────────────────────── */}
        <AccordionSection title="Uploads">
          {/* Main Photo */}
          <SingleUpload
            label="Main Photo Upload *"
            hint="(File size: up to 10MB, Dimensions: 1920×1080)"
            value={state.uploads.heroImageUrl}
            onChange={(v) => set.uploads({ heroImageUrl: v })}
            altText={state.uploads.heroAltText}
            onAltTextChange={(v) => set.uploads({ heroAltText: v })}
          />

          {/* Homepage Feature Image */}
          <SingleUpload
            label="Homepage Feature Image"
            hint="(File size: up to 5MB, Dimensions: 500×500) (This is applicable to premier listings only)"
            value={state.uploads.featureImageUrl}
            onChange={(v) => set.uploads({ featureImageUrl: v })}
          />

          {/* Gallery */}
          {isNew ? (
            <div className="border-b border-line pb-5 mb-5">
              <p className="font-sans text-sm font-medium text-ink/80 mb-1">Gallery Images</p>
              <p className="font-sans text-sm text-ink/40 italic">Save the listing first to add gallery images.</p>
            </div>
          ) : (
            <GalleryManager gallery={state.rows.gallery} onAdd={addGalleryImage} onRemove={removeGalleryImage} onReorder={reorderGallery} />
          )}

          {/* Video Link */}
          <div className="mb-5">
            <label className="font-sans text-sm text-ink/70 block mb-2">Video Link:</label>
            <input type="url" value={state.uploads.videoUrl} onChange={(e) => set.uploads({ videoUrl: e.target.value })} placeholder="https://youtube.com/..." className={inp} />
          </div>

        </AccordionSection>

        {/* ── 8. Optional Uploads ──────────────────────────────────────────── */}
        <AccordionSection title="Optional Uploads">
          {/* Upload floor plans */}
          <SingleUpload
            label="Upload floor plans"
            hint="(File size: up to 10MB)"
            value={state.uploads.floorPlanUploadUrl}
            onChange={(v) => set.uploads({ floorPlanUploadUrl: v })}
            accept="image/jpeg,image/png,image/webp,application/pdf"
          />

          {/* Upload Additional Video — matches legacy layout (2026-07-02). URL
              field (the DB column additional_video_url takes a string), same
              +Add/Save button shape as the 3D Tour Link below. */}
          <div className="border-b border-line pb-5 mb-5">
            <p className="font-sans text-sm font-medium text-ink/80 mb-2">Upload Additional Video</p>
            <div className="flex gap-2">
              <input
                type="url"
                value={state.uploads.additionalVideoUrl}
                onChange={(e) => set.uploads({ additionalVideoUrl: e.target.value })}
                placeholder="https://..."
                className={inp}
              />
              <button
                type="button"
                onClick={() => set.uploads({ additionalVideoUrl: "" })}
                className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors whitespace-nowrap"
              >
                + Add
              </button>
              <button
                type="button"
                className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-teal-400 text-teal-600 hover:bg-teal-500 hover:text-white transition-colors whitespace-nowrap"
              >
                Save
              </button>
            </div>
          </div>

          {/* 3D Tour Link */}
          <div className="border-b border-line pb-5 mb-5">
            <p className="font-sans text-sm font-medium text-ink/80 mb-2">3D Tour Link</p>
            <p className="font-sans text-xs text-ink/40 mb-2">
              If using a video that is already online, you can insert the URL here.
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                value={state.uploads.virtualTourUrl}
                onChange={(e) => set.uploads({ virtualTourUrl: e.target.value })}
                placeholder="https://..."
                className={inp}
              />
              <button
                type="button"
                onClick={() => set.uploads({ virtualTourUrl: "" })}
                className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors whitespace-nowrap"
              >
                + Add
              </button>
              <button
                type="button"
                className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-teal-400 text-teal-600 hover:bg-teal-500 hover:text-white transition-colors whitespace-nowrap"
              >
                Save
              </button>
            </div>
          </div>

          {/* Price List */}
          <SingleUpload
            label="Price List"
            hint="(File size: up to 10MB)"
            value={state.uploads.priceListUrl}
            onChange={(v) => set.uploads({ priceListUrl: v })}
            accept="image/jpeg,image/png,image/webp,application/pdf"
          />

          {/* Brochure */}
          <SingleUpload
            label="Brochure"
            hint="(File size: up to 10MB)"
            value={state.uploads.brochureUrl}
            onChange={(v) => set.uploads({ brochureUrl: v })}
            accept="image/jpeg,image/png,image/webp,application/pdf"
          />

          {/* Specifications */}
          <SingleUpload
            label="Specifications"
            hint="(File size: up to 10MB)"
            value={state.uploads.specificationsUrl}
            onChange={(v) => set.uploads({ specificationsUrl: v })}
            accept="image/jpeg,image/png,image/webp,application/pdf"
          />
        </AccordionSection>

        {/* ── 10. SEO ──────────────────────────────────────────────────────── */}
        {!isPortal && (
          <AccordionSection title="SEO">
            <div className="flex flex-col gap-4">
              <div>
                <label className="font-sans text-sm text-ink/70 block mb-1.5">Page Title:</label>
                <input type="text" value={state.seo.seoTitle} onChange={(e) => set.seo({ seoTitle: e.target.value })} placeholder="e.g. Luxury Apartments in Melbourne CBD | ProjectName" className={inp} />
              </div>
              <div>
                <label className="font-sans text-sm text-ink/70 block mb-1.5">Meta Description:</label>
                <textarea rows={8} value={state.seo.seoDescription} onChange={(e) => set.seo({ seoDescription: e.target.value })} placeholder="150–160 character description for search engines…" className={inp + " resize-none"} />
              </div>
            </div>
          </AccordionSection>
        )}

        {/* ── Form actions ─────────────────────────────────────────────────── */}
        {/* Filled-color scheme (2026-06-30): Back = ink/black, Save = green,
            Preview = orange, Delete = red. Same font/tracking as the rest of
            the admin UI so it doesn't feel out of place. Back honours isPortal
            so portal users don't get bounced by middleware to /admin/listings.

            Autosave indicator (2026-07-02) sits next to the Save button so
            users can see their changes are being persisted every few seconds. */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <Link
              href={isPortal ? "/portal/listings" : "/admin/listings"}
              className="font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 bg-ink text-white hover:bg-ink/80 transition-colors inline-flex items-center gap-1.5"
            >
              ← Back
            </Link>
            <button type="submit" disabled={saving || deleting} className="font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 bg-green-700 text-white hover:bg-green-800 transition-colors disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
            {!isNew && autoSaveStatus !== "idle" && (
              <span
                className={`font-mono text-[10px] uppercase tracking-widest ${
                  autoSaveStatus === "saving" ? "text-ink/50"
                  : autoSaveStatus === "saved" ? "text-green-700"
                  : "text-red-600"
                }`}
              >
                {autoSaveStatus === "saving" ? "Autosaving…"
                  : autoSaveStatus === "saved" ? "✓ Saved"
                  : "Autosave failed"}
              </span>
            )}
            {!isNew && existing?.slug && (
              <Link
                href={`/${categorySlug(state.category.type)}/${existing.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 bg-orange text-white hover:bg-orange/85 transition-colors"
              >
                Preview
              </Link>
            )}
          </div>
          {!isNew && (
            <button
              type="button"
              onClick={() => { setDeleteConfirmText(""); setShowDeleteModal(true); }}
              disabled={deleting || saving}
              className="font-mono text-label-sm uppercase tracking-widest px-4 py-2 bg-red-700 text-white hover:bg-red-800 transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete listing"}
            </button>
          )}
        </div>
      </form>

      {/* ── Delete confirmation modal ─────────────────────────────────────── */}
      {/* Floor plan delete confirmation modal (portal only) */}
      {pendingDeleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50">
          <div className="bg-white w-full max-w-md mx-4 p-6 flex flex-col gap-4">
            <h2 className="font-mono text-[13px] uppercase tracking-widest text-ink font-bold">Delete Configuration</h2>
            <p className="font-sans text-sm text-ink/70">
              You are about to delete the configuration:{" "}
              <strong>
                {getCardFields(state.category.type)
                  .map((f) => {
                    const v = (state.rows.floorPlans[pendingDeleteIndex] as unknown as Record<string, unknown>)?.[f.key];
                    return `${v == null || v === "" ? "—" : v} ${f.label}`;
                  })
                  .join(", ")}
                {state.rows.floorPlans[pendingDeleteIndex]?.price_from ? `, $${Number(state.rows.floorPlans[pendingDeleteIndex].price_from).toLocaleString()}` : ""}
              </strong>
              . This cannot be undone.
            </p>
            <p className="font-sans text-sm text-ink/70">Type <strong>delete</strong> below to confirm.</p>
            <input
              type="text"
              value={floorPlanDeleteText}
              onChange={(e) => setFloorPlanDeleteText(e.target.value)}
              placeholder="delete"
              autoFocus
              className="border border-line px-3 py-2 font-mono text-sm outline-none focus:border-red-400 w-full"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { removeFloorPlan(pendingDeleteIndex); setPendingDeleteIndex(null); setFloorPlanDeleteText(""); }}
                disabled={floorPlanDeleteText !== "delete"}
                className="flex-1 font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => { setPendingDeleteIndex(null); setFloorPlanDeleteText(""); }}
                className="flex-1 font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 border border-line text-ink/60 hover:text-ink transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50">
          <div className="bg-white w-full max-w-md mx-4 p-6 flex flex-col gap-4">
            <h2 className="font-mono text-[13px] uppercase tracking-widest text-ink font-bold">Delete listing</h2>
            <p className="font-sans text-sm text-ink/70">
              This will permanently delete <strong>{existing?.name ?? "this listing"}</strong> and cannot be undone.
            </p>
            <p className="font-sans text-sm text-ink/70">
              Type <strong>delete</strong> below to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="delete"
              className="border border-line px-3 py-2 font-mono text-sm outline-none focus:border-ink"
              autoFocus
            />
            <div className="flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
                className="font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 border border-ink text-ink hover:bg-ink hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteConfirmText !== "delete"}
                className="font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 bg-ink text-white hover:bg-ink/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
