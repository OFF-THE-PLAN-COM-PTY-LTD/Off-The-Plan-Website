"use client";

// Listing form orchestrator — owns all state (via useListingFormState), the
// autosave fingerprint loop, submit/delete, and composes the per-section
// components in features/listings/admin-form/sections/*.

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { GalleryImage, FloorPlan, MiniStocklistEntry, ListingFormProps } from "./types";
import { buildPayload } from "./build-payload";
import { useListingFormState } from "./use-listing-form-state";
import { MAX_STOCKLIST_ROWS, MAX_CONFIG_SUMMARY_ROWS } from "./constants";
import { SubscribeSection } from "./sections/subscribe-section";
import { CategorySection } from "./sections/category-section";
import { ProjectOverviewSection } from "./sections/project-overview-section";
import { TeamSection } from "./sections/team-section";
import { ConfigurationSummarySection } from "./sections/configuration-summary-section";
import { PropertiesAvailableSection } from "./sections/properties-available-section";
import { FeaturesSection } from "./sections/features-section";
import { AmenitiesSection } from "./sections/amenities-section";
import { AgentsSection } from "./sections/agents-section";
import { UploadsSection } from "./sections/uploads-section";
import { OptionalUploadsSection } from "./sections/optional-uploads-section";
import { SeoSection } from "./sections/seo-section";
import { FormActions } from "./sections/form-actions";
import { DeleteModals } from "./sections/delete-modals";

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
}: ListingFormProps) {
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

        {/* ── Subscribe & publish (portal only) ────────────────────────────── */}
        {isPortal && (
          <SubscribeSection id={id} existing={existing} overview={state.overview} address={state.address} />
        )}

        {/* ── 1. Category ─────────────────────────────────────────────────── */}
        <CategorySection isPortal={isPortal} category={state.category} setCategory={set.category} />

        {/* ── 2. Project Overview ──────────────────────────────────────────── */}
        <ProjectOverviewSection
          isNew={isNew}
          isPortal={isPortal}
          developers={developers}
          members={members}
          category={state.category}
          overview={state.overview}
          address={state.address}
          saleOffice={state.saleOffice}
          details={state.details}
          pricing={state.pricing}
          setOverview={set.overview}
          setAddress={set.address}
          setSaleOffice={set.saleOffice}
          setDetails={set.details}
          setPricing={set.pricing}
        />

        {/* ── 3. Team ──────────────────────────────────────────────────────── */}
        <TeamSection features={state.features} setFeatures={set.features} />

        {/* ── 4. Configuration Summary ─────────────────────────────────────── */}
        <ConfigurationSummarySection
          isNew={isNew}
          isPortal={isPortal}
          type={state.category.type}
          floorPlans={state.rows.floorPlans}
          addFloorPlan={addFloorPlan}
          removeFloorPlan={removeFloorPlan}
          updateFloorPlan={updateFloorPlan}
          setPendingDeleteIndex={setPendingDeleteIndex}
          setFloorPlanDeleteText={setFloorPlanDeleteText}
        />

        {/* ── 3b. Properties Available (mini stocklist) ────────────────────── */}
        <PropertiesAvailableSection
          type={state.category.type}
          miniStocklist={state.rows.miniStocklist}
          addStocklistRow={addStocklistRow}
          removeStocklistRow={removeStocklistRow}
          updateStocklistRow={updateStocklistRow}
        />

        {/* ── 4. Property Features ─────────────────────────────────────────── */}
        <FeaturesSection
          type={state.category.type}
          lifestyle={state.rows.lifestyle}
          toggleLifestyle={toggleLifestyle}
          setLifestyle={setLifestyle}
        />

        {/* ── 5. Nearby Amenities ──────────────────────────────────────────── */}
        <AmenitiesSection amenities={state.amenities} setAmenities={set.amenities} />

        {/* ── 6. Selling Agent(s) / Contact Details ────────────────────────── */}
        <AgentsSection isNew={isNew} id={id} agents={agents} />

        {/* ── 7. Uploads ───────────────────────────────────────────────────── */}
        <UploadsSection
          isNew={isNew}
          uploads={state.uploads}
          setUploads={set.uploads}
          gallery={state.rows.gallery}
          addGalleryImage={addGalleryImage}
          removeGalleryImage={removeGalleryImage}
          reorderGallery={reorderGallery}
        />

        {/* ── 8. Optional Uploads ──────────────────────────────────────────── */}
        <OptionalUploadsSection uploads={state.uploads} setUploads={set.uploads} />

        {/* ── 10. SEO ──────────────────────────────────────────────────────── */}
        {!isPortal && (
          <SeoSection seo={state.seo} setSeo={set.seo} />
        )}

        {/* ── Form actions ─────────────────────────────────────────────────── */}
        <FormActions
          isNew={isNew}
          isPortal={isPortal}
          saving={saving}
          deleting={deleting}
          autoSaveStatus={autoSaveStatus}
          type={state.category.type}
          existing={existing}
          setShowDeleteModal={setShowDeleteModal}
          setDeleteConfirmText={setDeleteConfirmText}
        />
      </form>

      {/* Delete-confirmation modals — rendered outside the <form> on purpose */}
      <DeleteModals
        type={state.category.type}
        existing={existing}
        floorPlans={state.rows.floorPlans}
        pendingDeleteIndex={pendingDeleteIndex}
        setPendingDeleteIndex={setPendingDeleteIndex}
        floorPlanDeleteText={floorPlanDeleteText}
        setFloorPlanDeleteText={setFloorPlanDeleteText}
        removeFloorPlan={removeFloorPlan}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        deleteConfirmText={deleteConfirmText}
        setDeleteConfirmText={setDeleteConfirmText}
        handleDelete={handleDelete}
      />
    </div>
  );
}
