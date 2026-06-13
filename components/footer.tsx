"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

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

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/offtheplan",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/offtheplan.com.au",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "X (Twitter)",
    href: "https://twitter.com/offtheplan",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "Pinterest",
    href: "https://www.pinterest.com.au/offtheplan",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/offtheplan",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/offtheplan",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
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
      {/* Top: logo + tagline + description */}
      <div className="max-w-screen-xl mx-auto px-6 md:px-10 pt-10 pb-6">
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
              {socialLinks.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 font-sans text-sm text-ink-light/80 hover:text-white transition-colors"
                  >
                    <span className="text-ink-light/60">{social.icon}</span>
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
