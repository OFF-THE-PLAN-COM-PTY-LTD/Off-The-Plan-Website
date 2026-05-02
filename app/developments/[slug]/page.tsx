import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PropertyCard } from "@/components/property-card";
import { EnquiryForm } from "@/components/enquiry-form";
import { Pill } from "@/components/pill";
import { CheckIcon } from "@/components/icons";
import { mockDevelopments, mockFloorPlans } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dev = mockDevelopments.find((d) => d.slug === params.slug);
  if (!dev) return { title: "Not Found" };
  return {
    title: `${dev.name} — ${dev.suburb}, ${dev.state}`,
    description: dev.summary ?? undefined,
    openGraph: {
      title: `${dev.name} | Off The Plan`,
      description: dev.summary ?? "",
      images: dev.hero_image_url ? [dev.hero_image_url] : dev.images?.[0]?.url ? [dev.images[0].url] : [],
    },
  };
}

export default function DossierPage({ params }: Props) {
  const dev = mockDevelopments.find((d) => d.slug === params.slug && d.is_published);
  if (!dev) notFound();

  const heroImageUrl =
    dev.images?.find((img) => img.is_hero)?.url ??
    dev.images?.[0]?.url ??
    dev.hero_image_url ??
    null;
  const floorPlans = mockFloorPlans.filter((fp) => fp.development_id === dev.id);
  const similar = mockDevelopments
    .filter((d) => d.id !== dev.id && d.state === dev.state && d.is_published)
    .slice(0, 3);

  const specs = [
    { label: "Architect", value: dev.architect },
    { label: "Interiors", value: dev.interiors },
    { label: "Landscape", value: dev.landscape },
    { label: "Builder", value: dev.builder },
    { label: "Levels", value: dev.levels?.toString() },
    { label: "Residences", value: dev.residence_count?.toString() },
  ].filter((s) => s.value);

  const amenities = dev.lifestyle ?? [];

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: dev.name,
    description: dev.summary,
    address: { "@type": "PostalAddress", addressLocality: dev.suburb, addressRegion: dev.state, addressCountry: "AU" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative h-[70vh] bg-navy overflow-hidden">
        {heroImageUrl ? (
          <Image src={heroImageUrl} alt={dev.name} fill className="object-cover opacity-60" priority sizes="100vw" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-navy-deep to-navy-mid" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />

        <div className="relative z-10 container-padded pt-24 pb-10 h-full flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <Link href="/search" className="font-mono text-label-sm uppercase tracking-widest text-ink-light/50 hover:text-ink-light transition-colors">
              ← Back to discover
            </Link>
          </div>
          <div>
            <div className="flex gap-2 mb-4">
              {dev.status && (
                <Pill variant={dev.status === "Selling now" ? "orange" : "white"}>{dev.status}</Pill>
              )}
              {dev.tag && <Pill variant="white">{dev.tag}</Pill>}
            </div>
            <h1 className="font-display font-light text-ink-light leading-none tracking-tight text-[clamp(48px,7vw,104px)] mb-3">
              {dev.name}
            </h1>
            <p className="font-mono text-label-lg uppercase tracking-widest text-ink-light/50 break-words">
              {dev.suburb}, {dev.state} · {dev.developer?.name}
            </p>
          </div>
        </div>
      </section>

      {/* ─── Spec Strip ───────────────────────────────────────── */}
      <div className="bg-navy border-t border-line-dark">
        <div className="container-padded py-5 grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { label: "From", value: dev.price_display },
            { label: "Beds", value: dev.beds_min === dev.beds_max ? dev.beds_min?.toString() : `${dev.beds_min}–${dev.beds_max}` },
            { label: "Type", value: dev.type },
            { label: "Completion", value: dev.completion_quarter },
          ].map((kpi) => kpi.value && (
            <div key={kpi.label}>
              <p className="font-mono text-label-sm uppercase tracking-widest text-ink-light/30 mb-0.5">{kpi.label}</p>
              <p className="font-mono text-label-lg text-ink-light">{kpi.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Overview + Enquiry ───────────────────────────────── */}
      <section className="bg-cream py-16">
        <div className="container-padded">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left: editorial content */}
            <div className="lg:col-span-2">
              <h2 className="font-display font-light text-navy text-section-lg mb-6">{dev.name}</h2>
              {dev.summary && (
                <p className="font-sans text-body-lg text-ink/70 leading-relaxed mb-8">{dev.summary}</p>
              )}

              {/* Spec grid */}
              {specs.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5 border-t border-line pt-8">
                  {specs.map((spec) => (
                    <div key={spec.label}>
                      <p className="font-mono text-label-sm uppercase tracking-widest text-ink/30 mb-0.5">{spec.label}</p>
                      <p className="font-sans text-body-md text-ink">{spec.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: sticky enquiry form */}
            <div>
              <div className="lg:sticky lg:top-24">
                <EnquiryForm developmentId={dev.id} developmentName={dev.name} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Floor Plans ──────────────────────────────────────── */}
      {floorPlans.length > 0 && (
        <section className="bg-white py-16 border-t border-line">
          <div className="container-padded">
            <div className="flex flex-wrap items-baseline gap-3 mb-8">
              <h2 className="font-display font-light text-navy text-section-lg">Floor plans</h2>
              <span className="font-mono text-label-sm uppercase tracking-widest text-ink/30">
                ({floorPlans.length} {floorPlans.length === 1 ? "typology" : "typologies"})
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {floorPlans.map((fp) => (
                <div key={fp.id} className="border border-line p-4">
                  <div className="relative h-32 bg-navy/5 mb-3 overflow-hidden">
                    {fp.image_url ? (
                      <Image src={fp.image_url} alt={fp.plan_type ?? "Floor plan"} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="font-mono text-label-sm text-ink/30 uppercase tracking-widest">Plan image</p>
                      </div>
                    )}
                  </div>
                  <p className="font-mono text-label-lg text-navy mb-1">{fp.plan_type}</p>
                  <p className="font-sans text-body-md text-ink/60">{fp.config}</p>
                  {fp.internal_sqm && (
                    <p className="font-mono text-label-sm text-ink/40">{fp.internal_sqm}m² internal</p>
                  )}
                  {fp.price_from && (
                    <p className="font-mono text-label-lg text-orange mt-1">From {formatPrice(fp.price_from)}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Price guide download / fallback */}
            <div className="mt-8">
              {dev.brochure_url ? (
                <a
                  href={dev.brochure_url}
                  download
                  className="btn-ghost inline-flex items-center gap-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    className="flex-shrink-0"
                  >
                    <path
                      d="M8 2v8M5 7l3 3 3-3M3 13h10"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Download Price Guide
                </a>
              ) : (
                <p className="font-mono text-label-sm text-ink/30">
                  Price guide available on enquiry
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── Amenities ────────────────────────────────────────── */}
      {amenities.length > 0 && (
        <section className="bg-cream py-16 border-t border-line">
          <div className="container-padded">
            <h2 className="font-display font-light text-navy text-section-lg mb-8">Lifestyle &amp; amenities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <ul className="flex flex-col gap-4">
                {amenities.map((a) => (
                  <li key={a} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full border border-orange flex items-center justify-center flex-shrink-0">
                      <CheckIcon size={12} className="text-orange" />
                    </span>
                    <span className="font-sans text-body-md text-ink">{a}</span>
                  </li>
                ))}
              </ul>
              <div className="relative h-64 overflow-hidden">
                {heroImageUrl ? (
                  <Image
                    src={heroImageUrl}
                    alt={`${dev.name} lifestyle`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-navy/10 flex items-center justify-center">
                    <p className="font-mono text-label-sm uppercase tracking-widest text-ink/30">Amenity render</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Similar Developments ─────────────────────────────── */}
      {similar.length > 0 && (
        <section className="bg-cream-alt py-16 border-t border-line">
          <div className="container-padded">
            <h2 className="font-display font-light text-navy text-section-lg mb-8">Similar developments</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
