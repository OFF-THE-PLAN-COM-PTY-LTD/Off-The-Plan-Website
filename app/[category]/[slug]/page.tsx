import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RequestInfoForm } from "@/components/request-info-form";
import { HeroCarousel } from "@/components/hero-carousel";
import { PropertiesTable } from "@/components/properties-table";
import { ReadMore } from "@/components/read-more";
import { FormattedDescription } from "@/components/formatted-description";
import { ListingDescription } from "@/components/listing-description";
import { CheckIcon, MailIcon } from "@/components/icons";
import { PhoneReveal } from "@/components/phone-reveal";
import { ShareButton } from "@/components/share-button";
import { EnquiryButton } from "@/components/enquiry-button";
import { VideoModal } from "@/components/video-modal";
import { ViewTracker } from "@/components/view-tracker";
import { formatListingTitle } from "@/lib/utils";
import { categorySlug, isValidCategorySlug } from "@/lib/listing-url";
import { GalleryGrid } from "@/components/gallery-grid";
import { supabase } from "@/lib/supabase/public";
import type { Development, DevelopmentFloorPlan } from "@/types/development";

interface Props {
  params: { category: string; slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isValidCategorySlug(params.category)) return { title: "Not Found" };

  const { data: dev } = await supabase
    .from("developments")
    .select("name, suburb, state, summary, hero_image_url, images:development_images(*)")
    .eq("slug", params.slug)
    .single();
  if (!dev) return { title: "Not Found" };
  const d = dev as unknown as Development;
  return {
    title: `${formatListingTitle(d.name, d.suburb)} — ${d.state}`,
    description: d.summary ?? undefined,
    openGraph: {
      title: `${d.name} | Off The Plan`,
      description: d.summary ?? "",
      images: d.hero_image_url ? [d.hero_image_url] : d.images?.[0]?.url ? [d.images[0].url] : [],
    },
  };
}

export default async function DossierPage({ params }: Props) {
  // The category segment lives at the site root, so guard it: anything that
  // isn't a known category slug is a 404 (keeps random top-level paths from
  // hitting the database and pretending to be listings).
  if (!isValidCategorySlug(params.category)) notFound();

  const { data: rawDev } = await supabase
    .from("developments")
    .select("*, developer:developers(*), images:development_images(*), floor_plans:development_floor_plans(*), listing_agents:listing_agents(name, email, mobile, photo_url, sort_order)")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .single();

  if (!rawDev) notFound();
  const dev = rawDev as unknown as Development;

  // Canonicalise the URL. The slug is unique, so we resolve the listing by
  // slug alone and then make sure the category segment matches the listing's
  // real type. A mismatch happens when:
  //   • an old /listings/<slug> link is followed (301 → /<category>/<slug>)
  //   • an admin changes a listing's category (its URL moves with it)
  //   • someone hand-edits the category in the URL
  // A permanent redirect keeps a single canonical URL for SEO.
  const canonicalCategory = categorySlug(dev.type);
  if (params.category !== canonicalCategory) {
    permanentRedirect(`/${canonicalCategory}/${dev.slug}`);
  }

  const heroImageUrl =
    dev.images?.find((img) => img.is_hero)?.url ??
    dev.images?.[0]?.url ??
    dev.hero_image_url ??
    null;

  const floorPlans = (dev.floor_plans ?? []) as DevelopmentFloorPlan[];

  // Hero first, then rest
  const heroImg = dev.images?.find((img) => img.is_hero) ?? dev.images?.[0] ?? null;
  const otherImgs = (dev.images ?? []).filter((img) => img !== heroImg);
  const allImages = heroImg ? [heroImg, ...otherImgs] : [...(dev.images ?? [])];


  const amenities = dev.lifestyle ?? [];

  // Configurations label: e.g. "1–4 bedroom Apartments"
  const configurationsLabel = (() => {
    if (!dev.beds_min) return dev.type ?? null;
    const beds =
      dev.beds_min === dev.beds_max
        ? `${dev.beds_min} bedroom`
        : `${dev.beds_min}–${dev.beds_max} bedroom`;
    return dev.type ? `${beds} ${dev.type}` : beds;
  })();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: dev.name,
    description: dev.summary,
    address: {
      "@type": "PostalAddress",
      addressLocality: dev.suburb,
      addressRegion: dev.state,
      addressCountry: "AU",
    },
  };

  return (
    <>
      {/* Silently log this page view */}
      <ViewTracker developmentId={dev.id} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ─── 1. Hero Carousel ─────────────────────────────────────────── */}
      <HeroCarousel
        images={allImages.map((img) => ({ url: img.url, caption: img.caption }))}
        name={dev.name}
      />

      {/* ─── 2. Info Bar — dark navy, matches reference ───────────────── */}
      <div className="bg-navy">
        <div className="container-padded py-6 flex flex-col lg:flex-row lg:items-start gap-6">

          {/* Developer logo in white box — links to developer website if available.
              Same cascade as the Contact Agent header: developer directory logo
              -> the listing's own project logo -> the developer/portal name text
              -> a blank fill. Portal-member listings usually only fill the
              listing-level logo, so falling back to it fixes the blank box. */}
          {(() => {
            const displayLogo = dev.developer?.logo_url ?? dev.logo_url ?? null;
            const displayName = dev.developer?.name ?? dev.portal_developer_name ?? null;
            const displayWebsite = dev.developer?.website ?? dev.developer_website ?? null;
            const logoContent = displayLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayLogo}
                alt={displayName ?? "Developer"}
                className="w-full h-full object-contain"
              />
            ) : displayName ? (
              <p className="font-mono text-[7.5px] uppercase tracking-[0.2em] text-ink/60 text-center leading-[1.7]">
                {displayName}
              </p>
            ) : (
              <div className="w-full h-full bg-navy/10" />
            );
            const wrapperClass = "flex-shrink-0 bg-white p-4 w-[110px] h-[110px] flex items-center justify-center";
            return displayWebsite ? (
              <a
                href={displayWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className={wrapperClass + " transition-opacity hover:opacity-80"}
                aria-label={`Visit ${displayName ?? "developer"} website`}
              >
                {logoContent}
              </a>
            ) : (
              <div className={wrapperClass}>{logoContent}</div>
            );
          })()}

          {/* Centre: name + address + stat row */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-5">
              <h1 className="font-mono text-[18px] md:text-[22px] uppercase tracking-[0.1em] text-white font-semibold leading-tight">
                {dev.name}
                {dev.suburb && !dev.name.toLowerCase().includes(dev.suburb.toLowerCase())
                  ? `, ${dev.suburb}`
                  : ""}
              </h1>
              <p className="font-sans text-[12px] text-white/60 sm:text-right sm:ml-6 flex-shrink-0">
                {[dev.suburb, dev.state, "Australia"].filter(Boolean).join(", ")}
              </p>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-x-8 gap-y-4 border-t border-white/10 pt-4">
              {dev.price_display && (
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-widest text-white/60 mb-1">Price Guide</p>
                  <p className="font-sans text-[14px] text-white">{dev.price_display}</p>
                </div>
              )}
              {dev.residence_count && (
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-widest text-white/60 mb-1">Residences</p>
                  <p className="font-sans text-[14px] text-white">{dev.residence_count}</p>
                </div>
              )}
              {configurationsLabel && (
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-widest text-white/60 mb-1">Configurations</p>
                  <p className="font-sans text-[14px] text-white">{configurationsLabel}</p>
                </div>
              )}
              {dev.developer?.name && (
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-widest text-white/60 mb-1">Developer</p>
                  <p className="font-sans text-[14px] text-white">{dev.developer.name}</p>
                </div>
              )}
              {(dev.completion_quarter ?? dev.status) && (
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-widest text-white/60 mb-1">Development Status</p>
                  <p className="font-sans text-[14px] text-white">
                    {dev.completion_quarter ?? dev.status}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Watch thumbnail + Enquire button */}
          <div className="flex-shrink-0 flex flex-col items-stretch gap-2 w-[120px]">
            {dev.video_url ? (
              <VideoModal
                videoUrl={dev.video_url}
                thumbnailUrl={heroImageUrl}
                title={dev.name}
              />
            ) : heroImageUrl ? (
              <div className="relative block w-full h-[76px] overflow-hidden">
                <Image
                  src={heroImageUrl}
                  alt={dev.name}
                  fill
                  className="object-cover"
                  sizes="120px"
                />
              </div>
            ) : null}
            <EnquiryButton
              developmentId={dev.id}
              developmentName={dev.name}
              developerName={dev.developer?.name}
              developerLogoUrl={dev.developer?.logo_url}
              className="flex items-center justify-center gap-1.5 bg-orange text-white font-mono text-[10px] uppercase tracking-widest px-3 py-3 hover:bg-orange/90 transition-colors w-full"
            >
              <MailIcon size={12} />
              Enquire
            </EnquiryButton>
          </div>
        </div>
      </div>

      {/* ─── 3. About ─────────────────────────────────────────────────── */}
      <section className="bg-cream py-16">
        <div className="container-padded grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: description */}
          <div className="lg:col-span-2 min-w-0 overflow-hidden">
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-6">About</p>
            {dev.description_html ? (
              <ListingDescription html={dev.description_html} />
            ) : dev.summary ? (
              <FormattedDescription text={dev.summary} />
            ) : (
              <p className="font-sans text-body-lg text-ink/40 italic">No description available.</p>
            )}

            {/* Spec grid */}
            {(() => {
              const specs = [
                { label: "Architect", value: dev.architect },
                { label: "Interiors", value: dev.interiors },
                { label: "Landscape", value: dev.landscape },
                { label: "Builder", value: dev.builder },
                { label: "Levels", value: dev.levels?.toString() },
                { label: "Residences", value: dev.residence_count?.toString() },
              ].filter((s) => s.value) as { label: string; value: string }[];
              return specs.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5 border-t border-line pt-8 mt-8">
                  {specs.map((spec) => (
                    <div key={spec.label}>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-ink/30 mb-0.5">{spec.label}</p>
                      <p className="font-sans text-body-md text-ink">{spec.value}</p>
                    </div>
                  ))}
                </div>
              ) : null;
            })()}
          </div>

          {/* Right: Contact Agent sidebar */}
          <div>
            <div className="lg:sticky lg:top-24">

              {/* ── Contact Agent header ── */}
              {/* Logo cascade: developer directory logo (linked via developer_id)
                  → the listing's own project logo (uploaded on the listing form)
                  → 2-letter monogram from the developer or the free-text
                  portal_developer_name a member typed. Portal-member listings
                  usually only fill the listing-level logo, so falling back to
                  it prevents a blank white square in the Contact Agent header. */}
              <div className="bg-navy flex items-center gap-3 px-4 py-3">
                {(() => {
                  const headerLogo = dev.developer?.logo_url ?? dev.logo_url ?? null;
                  const headerName = dev.developer?.name ?? dev.portal_developer_name ?? null;
                  return headerLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={headerLogo}
                      alt={headerName ?? "Developer"}
                      className="w-10 h-10 object-contain bg-white p-1 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-white/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-mono text-[7px] uppercase text-white/60">
                        {headerName?.slice(0, 2) ?? ""}
                      </span>
                    </div>
                  );
                })()}
                <p className="font-mono text-[13px] font-semibold uppercase tracking-widest text-white">
                  Contact Agent
                </p>
              </div>

              {/* ── Agent card ── */}
              <div className="border border-t-0 border-line bg-white px-4 py-4">
                {(() => {
                  // Pick the primary selling agent. Source order:
                  //   1. listing_agents rows (sorted by sort_order) — new structure used by the admin form
                  //   2. fall back to the flat agent_name/phone/email columns on the development row
                  //      (for legacy listings; mig 035 also backfills these into listing_agents)
                  // Logo source order:
                  //   1. The primary agent's own photo (listing_agents.photo_url) — uploaded via admin
                  //   2. The developer company's logo (developers.logo_url)
                  //   3. A 2-letter monogram fallback
                  const agentRecords = (dev as { listing_agents?: { name: string | null; email: string | null; mobile: string | null; photo_url: string | null; sort_order: number | null }[] }).listing_agents ?? [];
                  const primary = [...agentRecords].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
                  const name = primary?.name ?? dev.agent_name ?? null;
                  const phone = primary?.mobile ?? dev.agent_phone ?? null;
                  const email = primary?.email ?? dev.agent_email ?? null;
                  const agentPhoto = primary?.photo_url ?? null;
                  // Same fallback logic as the header above — prefer the linked
                  // developer directory logo, else use the listing's own logo.
                  const developerLogo = dev.developer?.logo_url ?? dev.logo_url ?? null;
                  const monogram =
                    name?.slice(0, 2)
                    ?? dev.developer?.name?.slice(0, 2)
                    ?? dev.portal_developer_name?.slice(0, 2)
                    ?? "";

                  return (
                    <div className="flex items-start gap-3 mb-3">
                      {agentPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={agentPhoto}
                          alt={name ?? "Selling agent"}
                          className="w-12 h-12 object-cover border border-line flex-shrink-0"
                        />
                      ) : developerLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={developerLogo}
                          alt={dev.developer?.name ?? "Developer"}
                          className="w-12 h-12 object-contain border border-line p-1 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-navy/5 border border-line flex items-center justify-center flex-shrink-0">
                          <span className="font-mono text-[8px] uppercase text-ink/40">{monogram}</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-sans font-semibold text-[14px] text-ink leading-tight mb-1">
                          {name ?? (dev.developer?.name ? `${dev.developer.name} Sales Team` : "Sales Team")}
                        </p>
                        {phone ? (
                          <PhoneReveal phone={phone} developmentId={dev.id} />
                        ) : email ? (
                          <a
                            href={`mailto:${email}`}
                            className="font-sans text-[13px] text-orange hover:text-orange/70 transition-colors truncate block"
                          >
                            {email}
                          </a>
                        ) : (
                          <a
                            href="#enquire"
                            className="font-sans text-[13px] text-orange hover:text-orange/70 transition-colors"
                          >
                            Enquire for details
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <EnquiryButton
                  developmentId={dev.id}
                  developmentName={dev.name}
                  developerName={dev.developer?.name}
                  developerLogoUrl={dev.developer?.logo_url}
                  className="flex items-center justify-center gap-2 w-full bg-navy text-white font-mono text-[10px] uppercase tracking-widest py-2.5 hover:bg-navy/80 transition-colors"
                >
                  <MailIcon size={12} />
                  Message
                </EnquiryButton>
              </div>

              {/* ── Share + Enquire footer row ── */}
              <div className="border border-t-0 border-line grid grid-cols-2">
                <ShareButton
                  slug={dev.slug}
                  category={categorySlug(dev.type)}
                  name={dev.name}
                  suburb={dev.suburb}
                  state={dev.state}
                  developmentId={dev.id}
                />
                <EnquiryButton
                  developmentId={dev.id}
                  developmentName={dev.name}
                  developerName={dev.developer?.name}
                  developerLogoUrl={dev.developer?.logo_url}
                  className="flex items-center justify-center gap-2 py-3 font-mono text-[10px] uppercase tracking-widest bg-orange text-white hover:bg-orange/90 transition-colors"
                >
                  <MailIcon size={12} />
                  Enquire
                </EnquiryButton>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. Resources ─────────────────────────────────────────────── */}
      <section className="bg-cream py-10 border-t border-line">
        <div className="container-padded">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-5">Resources</p>
          <div className="flex flex-wrap gap-3">
            {/* Deposit Solutions */}
            <a
              href="https://www.enaybl.com.au/off-the-plan-deposit-bond/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-2.5 bg-orange text-white font-mono text-[11px] uppercase tracking-widest hover:bg-orange/90 transition-colors"
            >
              Deposit Solutions
            </a>
            {/* Calculators */}
            <a
              href="/resources/calculators"
              className="inline-flex items-center px-6 py-2.5 bg-navy text-white font-mono text-[11px] uppercase tracking-widest hover:bg-navy/80 transition-colors"
            >
              Calculators
            </a>
            {/* News */}
            <a
              href="/journal"
              className="inline-flex items-center px-6 py-2.5 border border-navy text-navy font-mono text-[11px] uppercase tracking-widest hover:bg-navy hover:text-white transition-colors"
            >
              News
            </a>
            {/* Brochure download — only if available */}
            {dev.brochure_url && (
              <a
                href={dev.brochure_url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-2 px-6 py-2.5 border border-line text-ink font-mono text-[11px] uppercase tracking-widest hover:border-orange hover:text-orange transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 2v8M5 7l3 3 3-3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Download Brochure
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ─── 5. Features & Amenities ──────────────────────────────────── */}
      {amenities.length > 0 && (
        <section className="bg-navy py-10 border-t border-white/10">
          <div className="container-padded">
            <p className="font-mono text-[9px] uppercase tracking-widest text-white/45 mb-2">Lifestyle</p>
            <h2 className="font-display font-light text-white text-[1.6rem] leading-tight mb-6">
              Features &amp; Amenities
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6">
              {amenities.map((a) => (
                <div key={a} className="flex items-center gap-2.5">
                  <span className="w-[18px] h-[18px] rounded-full border border-orange flex items-center justify-center flex-shrink-0">
                    <CheckIcon size={9} className="text-orange" />
                  </span>
                  <span className="font-sans text-[13px] text-white/75">{a}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── 6. Gallery ───────────────────────────────────────────────── */}
      {(() => {
        const galleryImages = allImages.length > 0
          ? allImages.map((img) => ({ url: img.url, alt: img.caption ?? dev.name, id: img.id }))
          : [
              { url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&h=600&fit=crop&auto=format&q=80", alt: dev.name, id: "m1" },
              { url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=900&h=600&fit=crop&auto=format&q=80", alt: dev.name, id: "m2" },
              { url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&h=600&fit=crop&auto=format&q=80", alt: dev.name, id: "m3" },
              { url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&h=600&fit=crop&auto=format&q=80", alt: dev.name, id: "m4" },
              { url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&h=600&fit=crop&auto=format&q=80", alt: dev.name, id: "m5" },
              { url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=900&h=600&fit=crop&auto=format&q=80", alt: dev.name, id: "m6" },
            ];
        return (
          <section className="bg-white py-16 border-t border-line">
            <div className="container-padded">
              <div className="flex items-baseline gap-3 mb-6">
                <p className="font-mono text-[11px] uppercase tracking-widest text-navy font-semibold">Gallery</p>
                <span className="font-mono text-[10px] text-ink/30">
                  {galleryImages.length} {galleryImages.length === 1 ? "image" : "images"}
                </span>
              </div>
              <GalleryGrid
                images={galleryImages.map((img, i) => ({
                  url: img.url,
                  alt: `${img.alt} ${i + 1}`,
                  id: img.id,
                }))}
              />
            </div>
          </section>
        );
      })()}

      {/* ─── 7. Properties Available ──────────────────────────────────── */}
      <section className="bg-cream py-16 border-t border-line">
        <div className="container-padded">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-3">Availability</p>
          <h2 className="font-display font-light text-navy text-section-lg mb-8">Properties Available</h2>
          <PropertiesTable
            floorPlans={floorPlans}
            bedsMin={dev.beds_min}
            bedsMax={dev.beds_max}
            miniStocklist={dev.mini_stocklist ?? null}
            developmentType={dev.type}
          />
        </div>
      </section>

      {/* ─── 8. Enquire CTA strip ─────────────────────────────────────── */}
      <section className="bg-navy py-12 border-t border-white/10">
        <div className="container-padded flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-1">Register your interest</p>
            <h2 className="font-display font-light text-white text-section-lg">
              Interested in {dev.name}?
            </h2>
            <p className="font-sans text-white/60 text-body-md mt-1">
              Speak with a specialist and get the latest pricing.
            </p>
          </div>
          <EnquiryButton
            developmentId={dev.id}
            developmentName={dev.name}
            developerName={dev.developer?.name}
            developerLogoUrl={dev.developer?.logo_url}
            className="flex-shrink-0 flex items-center gap-2 bg-orange text-white font-mono text-[11px] uppercase tracking-widest px-8 py-4 hover:bg-orange/90 transition-colors"
          >
            <MailIcon size={14} />
            Enquire Now
          </EnquiryButton>
        </div>
      </section>

      {/* ─── 9. Location — full-width map ─────────────────────────────── */}
      {dev.suburb && (
        <section className="bg-cream border-t border-line">
          <div className="container-padded pt-12 pb-6">
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-3">Location</p>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display font-light text-navy text-section-lg">
                {[dev.suburb, dev.state].filter(Boolean).join(", ")}
              </h2>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([dev.suburb, dev.state, "Australia"].filter(Boolean).join(", "))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] uppercase tracking-widest text-orange hover:text-orange/70 transition-colors flex-shrink-0"
              >
                View on Google Maps →
              </a>
            </div>
            {(dev as { location_description?: string | null }).location_description && (
              <p className="font-sans text-ink/70 text-body-md leading-relaxed max-w-3xl mt-4">
                {(dev as { location_description?: string | null }).location_description}
              </p>
            )}
          </div>
          {/* Map embed — Google Maps, no API key required */}
          <div className="container-padded pb-8">
            <div className="w-full h-[420px]">
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent([dev.suburb, dev.state, dev.postcode, "Australia"].filter(Boolean).join(" "))}&output=embed&z=15`}
                className="w-full h-full border-0 block"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Map showing ${dev.suburb}`}
              />
            </div>
          </div>
        </section>
      )}

      {/* ─── 10. Request Information ──────────────────────────────────── */}
      <section className="bg-[#f0efec] py-16 border-t border-line">
        <div className="container-padded">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-8">
            Request Information
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 items-start">
            <RequestInfoForm developmentName={dev.name} developmentId={dev.id} />
            {heroImageUrl && (
              <div className="relative h-[340px] overflow-hidden">
                <Image src={heroImageUrl} alt={dev.name} fill className="object-cover" sizes="420px" />
                <div className="absolute bottom-0 left-0 right-0 bg-navy/70 px-4 py-3">
                  <p className="font-sans text-white text-[13px] font-medium">
                    {formatListingTitle(dev.name, dev.suburb)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
