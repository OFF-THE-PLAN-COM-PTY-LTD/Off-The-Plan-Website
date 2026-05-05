import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Off The Plan",
  description: "Australia's home of new property. Learn about who we are, our mission, and what we do.",
};

const VALUES = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="16" cy="16" r="12" />
        <path d="M16 10v6l4 2" strokeLinecap="round" />
      </svg>
    ),
    label: "Timely",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 4l3 9h9l-7 5 3 9-8-6-8 6 3-9-7-5h9z" strokeLinejoin="round" />
      </svg>
    ),
    label: "Innovative",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 20l8-12 8 12" strokeLinejoin="round" />
        <path d="M12 20h8" strokeLinecap="round" />
      </svg>
    ),
    label: "Ambitious",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="6" y="6" width="20" height="20" rx="2" />
        <path d="M11 16h10M16 11v10" strokeLinecap="round" />
      </svg>
    ),
    label: "Creative",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 6C10.477 6 6 10.477 6 16s4.477 10 10 10 10-4.477 10-10S21.523 6 16 6z" />
        <path d="M12 16l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: "Clear",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 16c0-5.523 4.477-10 10-10s10 4.477 10 10" />
        <path d="M6 16c0 5.523 4.477 10 10 10" strokeDasharray="3 3" />
        <path d="M22 22l4 4M22 26l4-4" strokeLinecap="round" />
      </svg>
    ),
    label: "Reliable",
  },
];

const TRUSTED_BY = [
  "LURE", "Good Selling", "ETON", "No Fly Zone", "FLAGSHIP", "fo:lar", "PF",
];

const WHAT_WE_DO = [
  "Provides a one-stop shop to list, promote and market off-the-plan and new home projects across Australia.",
  "Attract Tiers and Investors — to help you attract, maximise and convert more qualified buyers to your developments through national exposure, market insights and transaction support.",
  "Connects Buyers and Developers — a direct pipeline of off-the-plan buyers delivered straight to your development team. Whether you are looking to promote, list or market your development. Whether you want to promote your brand or your listing type, our platform is designed to provide you with the type of qualified buyers you're after.",
];

export default function AboutPage() {
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
      <section className="container-padded py-20 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
        <div>
          <p className="font-mono text-label-sm uppercase tracking-widest text-ink/40 mb-5">Who We Are</p>
          <p className="font-sans text-body-md text-ink/80 leading-relaxed mb-4">
            Off The Plan™ is an Australian property platform for new apartments, new homes, listings
            and house &amp; land packages available off-the-plan®. We connect buyers with current and
            upcoming property opportunities across Australia, providing direct access to new projects,
            developers and project marketing teams.
          </p>
          <p className="font-sans text-body-md text-ink/80 leading-relaxed">
            By focusing solely on new developments and facilitating relationships between buyers and
            established properties, we provide access and empower our members to review investments
            with confidence.
          </p>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&h=675&fit=crop&auto=format&q=80"
            alt="Modern Australian property"
            fill
            className="object-cover"
          />
        </div>
      </section>

      <div className="border-t border-line" />

      {/* ── Our Story ───────────────────────────────────────────────────────── */}
      <section className="container-padded py-20 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-10 md:gap-16 items-start">
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
      <section className="bg-cream py-24">
        <div className="container-padded text-center max-w-3xl mx-auto">
          <p className="font-mono text-label-sm uppercase tracking-widest text-ink/40 mb-8">Our Mission</p>
          <p className="font-sans text-body-md text-ink/50 mb-4">We are Off The Plan™ built specifically for new homes.</p>
          <p className="font-display font-light text-navy text-section-lg leading-snug">
            Our goal is to connect people with their dream new home or investment through an efficiently
            digital personalised experience.
          </p>
        </div>
      </section>

      <div className="border-t border-line" />

      {/* ── Our Values ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-cream">
        <div className="container-padded">
          <p className="font-mono text-label-sm uppercase tracking-widest text-ink/40 text-center mb-4">Our Values</p>
          <p className="font-sans text-body-md text-ink/50 text-center mb-14 max-w-xl mx-auto">
            Your selling process can turn into an extraordinary experience. Register for Off The Plan™
            services to connect to buyers.
          </p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-8">
            {VALUES.map((v) => (
              <div key={v.label} className="flex flex-col items-center gap-3">
                <div className="text-navy/60">{v.icon}</div>
                <p className="font-mono text-label-sm uppercase tracking-widest text-ink/60">{v.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-line" />

      {/* ── A Message From Our Founder ──────────────────────────────────────── */}
      <section className="container-padded py-20 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
        <div>
          <p className="font-mono text-label-sm uppercase tracking-widest text-ink/40 mb-5">
            A Message From Our Founder
          </p>
          <p className="font-sans text-body-md text-ink/80 leading-relaxed mb-4">
            Over the last twenty years I have seen a dangerous trend occurring in our housing market. The need
            for quality new property that meets the needs of Australians has never been greater. And yet finding
            it has never been harder.
          </p>
          <p className="font-sans text-body-md text-ink/80 leading-relaxed mb-4">
            Off The Plan™ was created to both democratise access to property, leverage best practice
            development and to provide developers with an effective, scalable platform to showcase their
            projects.
          </p>
          <p className="font-sans text-body-md text-ink/80 leading-relaxed mb-8">
            I strongly believe in Tasmania first, to identify and maximise the impact of innovation in the
            housing sector and engage with communities. I am proud to create pathways and empower all
            Australians to invest and engage with confidence.
          </p>
          <Link href="/contact" className="btn-primary inline-block">
            Talk to us
          </Link>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=900&h=675&fit=crop&auto=format&q=80"
            alt="Founder message"
            fill
            className="object-cover"
          />
        </div>
      </section>

      <div className="border-t border-line" />

      {/* ── Trusted By ──────────────────────────────────────────────────────── */}
      <section className="py-16 bg-cream">
        <div className="container-padded">
          <p className="font-mono text-label-sm uppercase tracking-widest text-ink/40 text-center mb-10">
            Trusted By
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
            {TRUSTED_BY.map((name) => (
              <span key={name} className="font-mono text-label-lg uppercase tracking-widest text-ink/30">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-line" />

      {/* ── What We Do ──────────────────────────────────────────────────────── */}
      <section className="container-padded py-20 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&h=675&fit=crop&auto=format&q=80"
            alt="What we do"
            fill
            className="object-cover"
          />
        </div>
        <div>
          <p className="font-mono text-label-sm uppercase tracking-widest text-ink/40 mb-5">What We Do</p>
          <ul className="flex flex-col gap-5">
            {WHAT_WE_DO.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange flex-shrink-0" />
                <p className="font-sans text-body-md text-ink/80 leading-relaxed">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="border-t border-line" />

      {/* ── Contact & Next Steps ─────────────────────────────────────────────── */}
      <section className="py-20 bg-cream">
        <div className="container-padded">
          <p className="font-mono text-label-sm uppercase tracking-widest text-ink/40 text-center mb-3">
            Contact &amp; Next Steps
          </p>
          <h2 className="font-display font-light text-navy text-section-lg text-center mb-14">
            How can we help you?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                label: "In The Market",
                desc: "If you're looking to purchase a new home or investment property, register now to connect with our team of experts.",
                cta: "Apply",
                href: "/search",
                image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop&auto=format&q=80",
              },
              {
                label: "Developers",
                desc: "If you are a developer or project marketer, list your project now to connect with qualified buyers.",
                cta: "Learn More",
                href: "/list-a-listing",
                image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop&auto=format&q=80",
              },
              {
                label: "General Enquiries",
                desc: "Try our team of experts, who can help you connect the dots between the buyer and the developer.",
                cta: "Contact Us",
                href: "/contact",
                image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&h=400&fit=crop&auto=format&q=80",
              },
            ].map((card) => (
              <div key={card.label} className="flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden mb-5">
                  <Image src={card.image} alt={card.label} fill className="object-cover" />
                </div>
                <p className="font-mono text-label-sm uppercase tracking-widest text-ink/40 mb-2">{card.label}</p>
                <p className="font-sans text-body-md text-ink/70 leading-relaxed mb-6 flex-1">{card.desc}</p>
                <Link href={card.href} className="btn-ghost self-start">
                  {card.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
