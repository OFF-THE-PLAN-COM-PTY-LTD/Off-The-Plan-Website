"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { SOCIAL_LINKS } from "@/lib/social-links";

const moreInfoLinks = [
  { label: "Contact us", href: "/contact" },
  { label: "About us", href: "/about" },
  { label: "Listings", href: "/search" },
  { label: "Developers", href: "/developers" },
  { label: "Resources", href: "/resources/calculators" },
  { label: "News", href: "/news" },
  { label: "Guides", href: "/guides" },
  { label: "Features & Pricing", href: "/features-and-pricing" },
  { label: "List with us", href: "/list-a-listing" },
];

const propertyLinks = [
  // Hrefs match the canonical type values used on /search (URL-encoded
  // so plus-signs survive Next routing). Previously these used
  // lowercased slugs (apartments / townhouses / etc.) that didn't
  // resolve to any actual filter — now they filter correctly.
  { label: "New Apartments",         href: "/search?type=New+Apartments" },
  { label: "Townhouses",             href: "/search?type=Townhouses" },
  { label: "Land and Estates",       href: "/search?type=Land+and+Estates" },
  { label: "Commercial",             href: "/search?type=Commercial" },
  { label: "House & Land",           href: "/search?type=Houses" },
  { label: "Over 55's / Retirement", href: "/search?type=Over+55%27s+%2F+Retirement" },
];

const stateLinks = [
  { label: "ACT", href: "/search?state=ACT" },
  { label: "NSW", href: "/search?state=NSW" },
  { label: "NT", href: "/search?state=NT" },
  { label: "QLD", href: "/search?state=QLD" },
  { label: "SA", href: "/search?state=SA" },
  { label: "TAS", href: "/search?state=TAS" },
  { label: "VIC", href: "/search?state=VIC" },
  { label: "WA", href: "/search?state=WA" },
];


function NewsletterForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName || !email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/circle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: `${firstName} ${lastName}`.trim(), email }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return <p className="font-sans text-sm text-ink-light/80 leading-relaxed">You're on the list — we'll be in touch with new listings.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="First Name*"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          className="flex-1 bg-transparent border border-ink-light/20 text-ink-light placeholder-ink-light/40 font-sans text-sm px-3 py-2 focus:outline-none focus:border-ink-light/60"
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="flex-1 bg-transparent border border-ink-light/20 text-ink-light placeholder-ink-light/40 font-sans text-sm px-3 py-2 focus:outline-none focus:border-ink-light/60"
        />
      </div>
      <input
        type="email"
        placeholder="Email*"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="bg-transparent border border-ink-light/20 text-ink-light placeholder-ink-light/40 font-sans text-sm px-3 py-2 focus:outline-none focus:border-ink-light/60"
      />
      <div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="font-mono text-label-sm uppercase tracking-widest border border-orange text-orange px-5 py-2 hover:bg-orange hover:text-white transition-colors disabled:opacity-50"
        >
          {status === "loading" ? "Sending…" : "Send"}
        </button>
        {status === "error" && (
          <p className="font-sans text-xs text-red-400 mt-2">Something went wrong. Please try again.</p>
        )}
      </div>
    </form>
  );
}

export function Footer() {
  return (
    <footer className="bg-navy text-ink-light">
      {/* Top: logo + tagline + description.
          Top padding is generous so the footer never slams into the previous
          page section — Tim flagged this as the missing "footer buffer". */}
      <div className="max-w-screen-xl mx-auto px-6 md:px-10 pt-16 md:pt-24 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/logo.png"
              alt="Off The Plan"
              width={180}
              height={52}
              className="h-12 w-auto object-contain invert mix-blend-screen"
            />
          </Link>
          <p className="font-sans text-sm font-semibold text-ink-light tracking-wide text-right">
            Australia's Destination for New Listings
          </p>
        </div>

        <div className="border-t border-ink-light/10 pt-6 grid md:grid-cols-2 gap-6 mb-6">
          <p className="font-sans text-sm text-ink-light/80 leading-relaxed">
            Australia's Home Of New Property | Off The Plan® is an Australian property platform for new
            apartments, new homes, listings and house & land packages available off-the-plan®.
            We connect buyers with current and upcoming property opportunities across Australia,
            providing direct access to new projects, developers and project marketing teams.
          </p>
          <p className="font-sans text-sm text-ink-light/80 leading-relaxed">
            The platform is evolving beyond a listings portal into a more connected property ecosystem.
            Bringing together buyers, developers, agents and service providers through integrated tools,
            project insights and transaction support. Designed to be clear, user-friendly and practical,
            Off The Plan® helps you explore, compare and move forward with confidence when buying
            off-the-plan® property.
          </p>
        </div>

        {/* Main link columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* More Info */}
          <div>
            <p className="font-mono text-label-sm uppercase tracking-widest text-ink-light/60 mb-4">
              More Info
            </p>
            <ul className="flex flex-col gap-2.5">
              {moreInfoLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="font-sans text-sm text-ink-light/80 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Properties */}
          <div>
            <p className="font-mono text-label-sm uppercase tracking-widest text-ink-light/60 mb-4">
              Properties
            </p>
            <ul className="flex flex-col gap-2.5">
              {propertyLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="font-sans text-sm text-ink-light/80 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Search by State */}
          <div>
            <p className="font-mono text-label-sm uppercase tracking-widest text-ink-light/60 mb-4">
              Search by State
            </p>
            <ul className="flex flex-col gap-2.5">
              {stateLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="font-sans text-sm text-ink-light/80 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Talk to Us */}
          <div>
            <p className="font-mono text-label-sm uppercase tracking-widest text-ink-light/60 mb-4">
              Talk to Us
            </p>
            <div className="flex flex-col gap-3">
              <a href="tel:0410313030" className="font-sans text-sm text-ink-light/80 hover:text-white transition-colors">
                0410 313 030
              </a>
              <a href="mailto:info@offtheplan.com.au" className="font-sans text-sm text-ink-light/80 hover:text-white transition-colors">
                info@offtheplan.com.au
              </a>
              <address className="font-sans text-sm text-ink-light/80 not-italic leading-relaxed">
                Commercial Suite 5,<br />
                8 Adelaide Terrace<br />
                East Perth<br />
                Western Australia - 6004
              </address>
            </div>
          </div>

          {/* Follow */}
          <div>
            <p className="font-mono text-label-sm uppercase tracking-widest text-ink-light/60 mb-4">
              Follow
            </p>
            <ul className="flex flex-col gap-3">
              {SOCIAL_LINKS.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 font-sans text-sm text-ink-light/80 hover:text-white transition-colors"
                  >
                    <span className="text-ink-light/60">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d={social.svgPath} />
                      </svg>
                    </span>
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <p className="font-mono text-label-sm uppercase tracking-widest text-ink-light/60 mb-4">
              Newsletter
            </p>
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-ink-light/10">
        <div className="max-w-screen-xl mx-auto px-6 md:px-10 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-3 font-sans text-xs text-ink-light/50">
            <Link href="/sitemap.xml" className="hover:text-ink-light/60 transition-colors uppercase tracking-widest">Sitemap</Link>
            <span>|</span>
            <Link href="/privacy" className="hover:text-ink-light/60 transition-colors uppercase tracking-widest">Privacy Policy</Link>
            <span>|</span>
            <Link href="/terms" className="hover:text-ink-light/60 transition-colors uppercase tracking-widest">Terms & Conditions</Link>
          </div>
          <p className="font-sans text-xs text-ink-light/50 uppercase tracking-widest">
            Copyright {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
