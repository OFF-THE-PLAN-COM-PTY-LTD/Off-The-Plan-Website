import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PropertyCard } from "@/components/property-card";
import { EnquiryForm } from "@/components/enquiry-form";
import { HeroCarousel } from "@/components/hero-carousel";
import { PropertiesTable } from "@/components/properties-table";
import { ReadMore } from "@/components/read-more";
import { CheckIcon, MailIcon } from "@/components/icons";
import { supabase } from "@/lib/supabase/public";
import type { Development, DevelopmentFloorPlan } from "@/types/development";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: dev } = await supabase
    .from("developments")
    .select("name, suburb, state, summary, hero_image_url, images:development_images(*)")
    .eq("slug", params.slug)
    .single();
  if (!dev) return { title: "Not Found" };
  const d = dev as unknown as Development;
  return {
    title: `${d.name} — ${d.suburb}, ${d.state}`,
    description: d.summary ?? undefined,
    openGraph: {
      title: `${d.name} | Off The Plan`,
      description: d.summary ?? "",
      images: d.hero_image_url ? [d.hero_image_url] : d.images?.[0]?.url ? [d.images[0].url] : [],
    },
  };
}

export default async function DossierPage({ params }: Props) {
  const { data: rawDev } = await supabase
    .from("developments")
    .select("*, developer:developers(*), images:development_images(*), floor_plans:development_floor_plans(*)")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .single();

  if (!rawDev) notFound();
  const dev = rawDev as unknown as Development;

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

  const { data: similarData } = await supabase
    .from("developments")
    .select("*, developer:developers(*), images:development_images(*)")
    .eq("is_published", true)
    .eq("state", rawDev.state ?? "")
    .neq("id", rawDev.id)
    .limit(2);
  const similar = (similarData ?? []) as unknown as Development[];

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ─── 1. Hero Carousel ─────────────────────────────────────────── */}
      <HeroCarousel
        images={allImages.map((img) => ({ url: img.url, caption: img.caption }))}
        name={dev.name}
      />

      {/* ─── 2. Info Bar — dark navy, matches reference ───────────────── */}
      <div className="bg-navy">
        <div className="container-padded py-6 flex flex-col lg:flex-row lg:items-start gap-6">

          {/* Developer logo in white box */}
          <div className="flex-shrink-0 bg-white p-4 w-[110px] h-[110px] flex items-center justify-center">
            {dev.developer?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dev.developer.logo_url}
                alt={dev.developer?.name ?? "Developer"}
                className="w-full h-full object-contain"
              />
            ) : dev.developer ? (
              <p className="font-mono text-[7.5px] uppercase tracking-[0.2em] text-ink/60 text-center leading-[1.7]">
                {dev.developer.name}
              </p>
            ) : (
              <div className="w-full h-full bg-navy/10" />
            )}
          </div>

          {/* Centre: name + address + stat row */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-5">
              <h1 className="font-mono text-[18px] md:text-[22px] uppercase tracking-[0.1em] text-white font-semibold leading-tight">
                {dev.name}
                {dev.suburb ? `, ${dev.suburb}` : ""}
              </h1>
              <p className="font-sans text-[12px] text-white/45 sm:text-right sm:ml-6 flex-shrink-0">
                {[dev.suburb, dev.state, "Australia"].filter(Boolean).join(", ")}
              </p>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-x-8 gap-y-4 border-t border-white/10 pt-4">
              {dev.price_display && (
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-widest text-white/35 mb-1">Price Guide</p>
                  <p className="font-sans text-[14px] text-white">{dev.price_display}</p>
                </div>
              )}
              {dev.residence_count && (
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-widest text-white/35 mb-1">Residences</p>
                  <p className="font-sans text-[14px] text-white">{dev.residence_count}</p>
                </div>
              )}
              {configurationsLabel && (
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-widest text-white/35 mb-1">Configurations</p>
                  <p className="font-sans text-[14px] text-white">{configurationsLabel}</p>
                </div>
              )}
              {dev.developer?.name && (
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-widest text-white/35 mb-1">Developer</p>
                  <p className="font-sans text-[14px] text-white">{dev.developer.name}</p>
                </div>
              )}
              {(dev.completion_quarter ?? dev.status) && (
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-widest text-white/35 mb-1">Development Status</p>
                  <p className="font-sans text-[14px] text-white">
                    {dev.completion_quarter ?? dev.status}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Watch thumbnail + Enquire button */}
          <div className="flex-shrink-0 flex flex-col items-stretch gap-2 w-[120px]">
            {heroImageUrl && (
              <a href="#enquire" className="relative block w-full h-[76px] overflow-hidden group">
                <Image
                  src={heroImageUrl}
                  alt={dev.name}
                  fill
                  className="object-cover"
                  sizes="120px"
                />
                {/* play overlay */}
                <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-end group-hover:bg-black/40 transition-colors">
                  <div className="flex items-center gap-1 bg-black/50 w-full justify-center py-1.5">
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-white" aria-hidden="true">
                      <path d="M5 4l12 6-12 6V4z" />
                    </svg>
                    <span className="font-mono text-white text-[9px] uppercase tracking-widest">Watch</span>
                  </div>
                </div>
              </a>
            )}
            <a
              href="#enquire"
              className="flex items-center justify-center gap-1.5 bg-orange text-white font-mono text-[10px] uppercase tracking-widest px-3 py-3 hover:bg-orange/90 transition-colors w-full"
            >
              <MailIcon size={12} />
              Enquire
            </a>
          </div>
        </div>
      </div>

      {/* ─── 3. About ─────────────────────────────────────────────────── */}
      <section className="bg-cream py-16">
        <div className="container-padded grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: description */}
          <div className="lg:col-span-2">
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-3">About</p>
            <h2 className="font-display font-light text-navy text-section-lg mb-6">{dev.name}</h2>
            {dev.summary ? (
              <ReadMore text={dev.summary} limit={320} />
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

          {/* Right: sticky developer card + enquiry form */}
          <div>
            <div className="lg:sticky lg:top-24">
              {dev.developer && (
                <div className="bg-white border border-line px-5 py-4 mb-4 flex items-center gap-4">
                  {dev.developer.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={dev.developer.logo_url}
                      alt={dev.developer.name}
                      className="h-10 max-w-[110px] object-contain flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-navy/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-mono text-[7px] uppercase tracking-widest text-ink/40">
                        {dev.developer.name.slice(0, 2)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-ink/40 mb-0.5">Developer</p>
                    <p className="font-sans font-medium text-body-md text-ink">{dev.developer.name}</p>
                  </div>
                </div>
              )}
              <EnquiryForm developmentId={dev.id} developmentName={dev.name} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. Resources ─────────────────────────────────────────────── */}
      {dev.brochure_url && (
        <section className="bg-white py-12 border-t border-line">
          <div className="container-padded">
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-3">Downloads</p>
            <h2 className="font-display font-light text-navy text-section-lg mb-6">Resources</h2>
            <div className="flex flex-wrap gap-4">
              <a
                href={dev.brochure_url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-2 border border-line px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-ink hover:border-orange hover:text-orange transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 2v8M5 7l3 3 3-3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Download Brochure
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ─── 5. Features & Amenities ──────────────────────────────────── */}
      {amenities.length > 0 && (
        <section className="bg-navy py-16 border-t border-white/10">
          <div className="container-padded">
            <p className="font-mono text-[11px] uppercase tracking-widest text-white/35 mb-3">Lifestyle</p>
            <h2 className="font-display font-light text-white text-section-lg mb-8">
              Features &amp; Amenities
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {amenities.map((a) => (
                <div key={a} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full border border-orange flex items-center justify-center flex-shrink-0">
                    <CheckIcon size={11} className="text-orange" />
                  </span>
                  <span className="font-sans text-[14px] text-white/80">{a}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── 6. Gallery ───────────────────────────────────────────────── */}
      {allImages.length > 0 && (
        <section className="bg-white py-16 border-t border-line">
          <div className="container-padded">
            <div className="flex items-baseline gap-3 mb-6">
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40">Gallery</p>
              <span className="font-mono text-[10px] text-ink/30">
                {allImages.length} {allImages.length === 1 ? "image" : "images"}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {allImages.map((img, i) => (
                <div key={img.id ?? i} className="relative h-52 overflow-hidden bg-navy/5">
                  <Image
                    src={img.url}
                    alt={img.caption ?? `${dev.name} ${i + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── 7. Properties Available ──────────────────────────────────── */}
      <section className="bg-cream py-16 border-t border-line">
        <div className="container-padded">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-3">Availability</p>
          <h2 className="font-display font-light text-navy text-section-lg mb-8">Properties Available</h2>
          <PropertiesTable
            floorPlans={floorPlans}
            bedsMin={dev.beds_min}
            bedsMax={dev.beds_max}
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
          <a
            href="#enquire"
            className="flex-shrink-0 flex items-center gap-2 bg-orange text-white font-mono text-[11px] uppercase tracking-widest px-8 py-4 hover:bg-orange/90 transition-colors"
          >
            <MailIcon size={14} />
            Enquire Now
          </a>
        </div>
      </section>

      {/* ─── 9. Location — full-width map ─────────────────────────────── */}
      {dev.lat && dev.lng && (
        <section className="bg-cream border-t border-line">
          <div className="container-padded pt-12 pb-6">
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-1">Location</p>
            <div className="flex items-baseline justify-between">
              <h2 className="font-display font-light text-navy text-section-lg">
                {[dev.suburb, dev.state].filter(Boolean).join(", ")}
              </h2>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([dev.suburb, dev.state, "Australia"].filter(Boolean).join(", "))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] uppercase tracking-widest text-orange hover:text-orange/70 transition-colors"
              >
                View on Google Maps →
              </a>
            </div>
          </div>
          {/* Map — full viewport width, no side padding */}
          <div className="w-full h-[480px]">
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${dev.lng - 0.012},${dev.lat - 0.012},${dev.lng + 0.012},${dev.lat + 0.012}&layer=mapnik&marker=${dev.lat},${dev.lng}`}
              className="w-full h-full border-0 block"
              loading="lazy"
              title={`Map showing ${dev.suburb ?? "location"}`}
            />
          </div>
          <div className="container-padded pb-8" />
        </section>
      )}

      {/* ─── 10. Request Information ──────────────────────────────────── */}
      <section id="enquire" className="bg-white py-16 border-t border-line">
        <div className="container-padded">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-3">Get in touch</p>
          <h2 className="font-display font-light text-navy text-section-lg mb-8">Request Information</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <EnquiryForm developmentId={dev.id} developmentName={dev.name} />
            <div className="relative min-h-[420px] overflow-hidden hidden lg:block">
              {heroImageUrl ? (
                <Image src={heroImageUrl} alt={dev.name} fill className="object-cover" sizes="50vw" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy/60" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 11. Similar Listings ─────────────────────────────────────── */}
      {similar.length > 0 && (
        <section className="bg-cream-alt py-16 border-t border-line">
          <div className="container-padded">
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-3">Explore more</p>
            <h2 className="font-display font-light text-navy text-section-lg mb-8">Similar Listings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {similar.map((d) => (
                <PropertyCard key={d.id} development={d} layout="tall" />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
