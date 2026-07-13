import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { AboutValues } from "@/features/about/components/about-values";
import { LogoSlider } from "@/features/about/components/logo-slider";
import { ContactNextSteps } from "@/features/about/components/contact-next-steps";
import { supabase } from "@/lib/supabase/public";

export const metadata: Metadata = {
  title: "About | Off The Plan",
  description: "Australia's home of new property. Learn about who we are, our mission, and what we do.",
};

// Always fetch fresh — keeps the rotating listing images in sync with the
// current published catalogue.
export const dynamic = "force-dynamic";

const WHAT_WE_DO = [
  "Comprehensive Listings – A wide selection of off-the-plan apartments, houses, townhouses, commercial properties, house & land and estates",
  "Market Tools and Resources – Mortgage calculators, insights and guides to support smarter property decisions",
  "Developer and Agent Support – Effective exposure for projects through tailored listings, marketing solutions and analytics",
];

// Static fallbacks — only used when the DB has fewer than 3 published hero
// images. Self-hosted in /public so we never fall back to Unsplash again.
const FALLBACK_IMAGES = [
  "/categories/category-apartments.jpg",
  "/categories/category-house-and-land.jpg",
  "/categories/category-landestate.jpg",
];

export default async function AboutPage() {
  // Pull 3 distinct hero images from published listings. Featured listings
  // first, then a deterministic ordering by id so the same About visit
  // shows the same three projects across the page.
  const { data: heroData } = await supabase
    .from("developments")
    .select("hero_image_url, name")
    .eq("is_published", true)
    .not("hero_image_url", "is", null)
    .order("is_featured", { ascending: false })
    .order("id", { ascending: true })
    .limit(6);

  const heroImages = (heroData ?? [])
    .map((d) => ({ url: d.hero_image_url as string | null, name: d.name as string | null }))
    .filter((d): d is { url: string; name: string | null } => Boolean(d.url));

  // Pick 3, padding from the static fallbacks if the DB has fewer.
  const aboutImages: { url: string; alt: string }[] = [
    heroImages[0] ?? null,
    heroImages[1] ?? null,
    heroImages[2] ?? null,
  ].map((d, i) => d
    ? { url: d.url, alt: d.name ? `Featured project — ${d.name}` : "Featured project" }
    : { url: FALLBACK_IMAGES[i], alt: "Off The Plan listing" });

  return (
    <div className="min-h-screen bg-cream pt-16">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="bg-navy py-20 md:py-28">
        <div className="container-padded">
          <p className="font-mono text-label-sm uppercase tracking-widest text-ink-light/40 mb-4">
            About Us
          </p>
          <h1 className="font-display font-light text-ink-light text-section-xl leading-tight max-w-3xl">
            Australia's Home Of New Property.
          </h1>
        </div>
      </section>

      {/* ── Who We Are ──────────────────────────────────────────────────────── */}
      <section className="container-padded py-14 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-start">
        <div>
          <p className="font-mono uppercase tracking-widest text-navy mb-5" style={{ fontSize: "20px" }}>Who We Are</p>
          <p className="font-sans text-[19px] leading-[1.9] text-ink/80 mb-6">
            Off The Plan™ is an Australian property platform for new apartments, new homes, listings
            and house &amp; land packages available off-the-plan®. We connect buyers with current and
            upcoming property opportunities across Australia, providing direct access to new projects,
            developers and project marketing teams.
          </p>
          <p className="font-sans text-body-lg text-ink/80">
            By focusing solely on new developments and facilitating relationships between buyers and
            established properties, we provide access and empower our members to review investments
            with confidence.
          </p>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden">
          <Image
            src={aboutImages[0].url}
            alt={aboutImages[0].alt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            unoptimized={aboutImages[0].url.includes("s3.")}
          />
        </div>
      </section>

      <div className="border-t border-line" />

      {/* ── Our Story ───────────────────────────────────────────────────────── */}
      <section className="container-padded py-14 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 md:gap-12 items-start">
        <p className="font-mono uppercase tracking-widest text-navy pt-1" style={{ fontSize: "20px" }}>Our Story</p>
        <div className="flex flex-col gap-4">
          <p className="font-sans text-body-md text-ink/80 leading-relaxed">
            offtheplan.com.au™ is an independent property portal designed exclusively to showcase new
            Australian properties and developments. As Australia's leading dedicated off-the-plan
            marketplace, our platform unites every category of new property.
          </p>
          <p className="font-sans text-body-md text-ink/80 leading-relaxed">
            From apartments and townhouses to new home designs, house-and-land packages, masterplanned
            estates, and commercial projects. We give buyers, developers, and real estate professionals
            one easy, transparent place to connect, discover, and engage with opportunity.
          </p>
        </div>
      </section>

      <div className="border-t border-line" />

      {/* ── Our Mission ─────────────────────────────────────────────────────── */}
      <section className="bg-cream py-16">
        <div className="container-padded text-center max-w-3xl mx-auto">
          <p className="font-mono uppercase tracking-widest text-navy mb-8" style={{ fontSize: "20px" }}>Our Mission</p>
          <p className="font-sans text-body-md text-ink/70 mb-4">We are Off-The-Plan® – Australia's home for new homes.</p>
          <p className="font-sans text-body-md text-navy leading-relaxed">
            offtheplan.com.au™ is a trusted, transparent, and easy-to-use marketplace connecting buyers,
            developers, and agents through an affordable, premium digital experience.
          </p>
        </div>
      </section>

      <div className="border-t border-line" />

      {/* ── Our Values ── Tim PDF I20: tighten this section's vertical rhythm. */}
      <section className="py-12 bg-cream">
        <div className="container-padded">
          <p className="font-mono uppercase tracking-widest text-navy text-center mb-3" style={{ fontSize: "20px" }}>Our Values</p>
          <p className="font-sans text-body-md text-ink/70 text-center mb-8 max-w-3xl mx-auto">
            Our values guide every decision we make and every relationship we build. At offtheplan.com.au™ we are committed to:
          </p>
          <AboutValues />
        </div>
      </section>

      <div className="border-t border-line" />

      {/* ── A Message From Our Founder ──────────────────────────────────────── */}
      <section className="container-padded py-14 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-start">
        <div>
          <p className="font-mono uppercase tracking-widest text-navy mb-5" style={{ fontSize: "20px" }}>
            A Message From Our Founder
          </p>
          <p className="font-sans text-[19px] leading-[1.9] text-ink/80 mb-6">
            After more than twenty years in real estate, I recognised a significant gap in the market — the need
            for an affordable, easy-to-use platform that brings together all forms of off-the-plan property
            within a single, trusted domain.
          </p>
          <p className="font-sans text-[19px] leading-[1.9] text-ink/80 mb-6">
            offtheplan.com.au™ was created to fulfil that purpose: to simplify how buyers discover new
            developments and to provide developers with an effective, results-oriented platform to showcase
            their projects.
          </p>
          <p className="font-sans text-[19px] leading-[1.9] text-ink/80 mb-7">
            Today, our mission remains focused on accessibility, innovation and connection. Helping Australians
            and the world to explore and secure opportunities across Australia.
          </p>
          <p className="font-display font-light text-navy text-[19px] mb-8">— Tim W.</p>
          <Link href="/contact" className="btn-primary inline-block">
            Talk to us
          </Link>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden">
          <Image
            src={aboutImages[1].url}
            alt={aboutImages[1].alt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            unoptimized={aboutImages[1].url.includes("s3.")}
          />
        </div>
      </section>

      <div className="border-t border-line" />

      {/* ── Trusted By ──────────────────────────────────────────────────────── */}
      <section className="py-16 bg-cream">
        <LogoSlider />
      </section>

      <div className="border-t border-line" />

      {/* ── What We Do ──────────────────────────────────────────────────────── */}
      <section className="container-padded py-14 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-start">
        <div className="relative aspect-[4/5] overflow-hidden">
          <Image
            src={aboutImages[2].url}
            alt={aboutImages[2].alt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            unoptimized={aboutImages[2].url.includes("s3.")}
          />
        </div>
        <div>
          <p className="font-mono uppercase tracking-widest text-navy mb-4" style={{ fontSize: "20px" }}>What We Do</p>
          <p className="font-sans text-[19px] leading-[1.9] text-ink/80 mb-6">
            offtheplan.com.au™ provides a streamlined way to explore Australia&apos;s newest property developments. We offer:
          </p>
          <ul className="flex flex-col gap-6 mb-7">
            {WHAT_WE_DO.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-3 w-1.5 h-1.5 rounded-full bg-orange flex-shrink-0" />
                <p className="font-sans text-[19px] leading-[1.9] text-ink/80">{item}</p>
              </li>
            ))}
          </ul>
          <p className="font-sans text-[19px] leading-[1.9] text-ink/80">
            Our platform is designed with clarity and simplicity in mind, helping users navigate the off-the-plan market with confidence. Whether you are purchasing your first home, expanding your investment portfolio or launching a new project, we are here to connect you with the right opportunities.
          </p>
        </div>
      </section>

      <div className="border-t border-line" />

      {/* ── Contact & Next Steps ─────────────────────────────────────────────── */}
      <section className="py-20 bg-cream">
        <div className="container-padded">
          <p className="font-mono uppercase tracking-widest text-navy text-center mb-12" style={{ fontSize: "20px" }}>
            Contact &amp; Next Steps
          </p>
          <ContactNextSteps />
        </div>
      </section>

    </div>
  );
}
