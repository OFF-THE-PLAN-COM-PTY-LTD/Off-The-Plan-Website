import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { AboutValues } from "@/components/about-values";

export const metadata: Metadata = {
  title: "About | Off The Plan",
  description: "Australia's home of new property. Learn about who we are, our mission, and what we do.",
};


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
          <p className="font-mono uppercase tracking-widest text-navy mb-5" style={{ fontSize: "20px" }}>Who We Are</p>
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
          <p className="font-mono uppercase tracking-widest text-navy mb-8" style={{ fontSize: "20px" }}>Our Mission</p>
          <p className="font-sans text-body-md text-ink/70 mb-4">We are Off-The-Plan® – Australia's home for new homes.</p>
          <p className="font-sans text-body-md text-navy leading-relaxed">
            offtheplan.com.au™ is a trusted, transparent, and easy-to-use marketplace connecting buyers,
            developers, and agents through an affordable, premium digital experience.
          </p>
        </div>
      </section>

      <div className="border-t border-line" />

      {/* ── Our Values ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-cream">
        <div className="container-padded">
          <p className="font-mono uppercase tracking-widest text-navy text-center mb-4" style={{ fontSize: "20px" }}>Our Values</p>
          <p className="font-sans text-body-md text-ink/70 text-center mb-14 max-w-3xl mx-auto">
            Our values guide every decision we make and every relationship we build. At offtheplan.com.au™ we are committed to:
          </p>
          <AboutValues />
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
