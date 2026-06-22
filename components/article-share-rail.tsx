"use client";

import { getSocial } from "@/lib/social-links";

/**
 * Vertical share rail beside the article body on desktop, below on mobile.
 *
 * Matches the legacy site (offtheplan.com.au) exactly: Print, Email,
 * LinkedIn, Instagram, Facebook — same order, same icons. Print and Email
 * are article-specific actions (open the print dialog / email this article).
 * LinkedIn / Instagram / Facebook are the Off The Plan brand profile links
 * (the legacy site also links to the profiles, not per-article share URLs).
 */
export function ArticleShareRail({ title, slug }: { title: string; slug: string }) {
  // SSR-safe — these only run on click in the browser.
  const url = () =>
    typeof window !== "undefined"
      ? `${window.location.origin}/journal/${slug}`
      : `/journal/${slug}`;

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };
  const mailHref = () =>
    `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url())}`;

  const linkedIn = getSocial("LinkedIn");
  const instagram = getSocial("Instagram");
  const facebook = getSocial("Facebook");

  const rowClass =
    "flex items-center gap-3 px-3 py-2.5 font-mono text-[11px] uppercase tracking-widest text-ink/70 hover:text-orange transition-colors border-b border-line last:border-b-0 w-full text-left";

  return (
    <aside aria-label="Share this article" className="border border-line bg-white">
      <p className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-widest text-ink/40 border-b border-line">
        Share
      </p>

      <button type="button" onClick={handlePrint} className={rowClass}>
        <PrintIcon />
        Print
      </button>

      {/* mailto link */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href={mailHref()} className={rowClass} aria-label="Email this article">
        <EmailIcon />
        Email
      </a>

      {linkedIn && (
        <a
          href={linkedIn.href}
          target="_blank"
          rel="noopener noreferrer"
          className={rowClass}
          aria-label="LinkedIn"
        >
          <BrandIcon path={linkedIn.svgPath} />
          LinkedIn
        </a>
      )}

      {instagram && (
        <a
          href={instagram.href}
          target="_blank"
          rel="noopener noreferrer"
          className={rowClass}
          aria-label="Instagram"
        >
          <BrandIcon path={instagram.svgPath} />
          Instagram
        </a>
      )}

      {facebook && (
        <a
          href={facebook.href}
          target="_blank"
          rel="noopener noreferrer"
          className={rowClass}
          aria-label="Facebook"
        >
          <BrandIcon path={facebook.svgPath} />
          Facebook
        </a>
      )}
    </aside>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────

function BrandIcon({ path }: { path: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="flex-shrink-0">
      <path d={path} />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0">
      <path d="M6 9V3h12v6" />
      <rect x="6" y="14" width="12" height="7" />
      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
      <circle cx="18" cy="11.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0">
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
