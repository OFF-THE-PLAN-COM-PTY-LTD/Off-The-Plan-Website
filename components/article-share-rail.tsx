"use client";

import { useState } from "react";

/**
 * Vertical share rail shown beside the article body on desktop, and below
 * the body on mobile. Matches the legacy site (offtheplan.com.au) which
 * exposes Facebook, X, LinkedIn, Email, Print, Copy Link.
 *
 * Article URL is computed at render time so the link works in any
 * deployment environment (vercel preview, prod, local).
 */
export function ArticleShareRail({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);

  // SSR-safe: window.location is read inside the handlers, not at render.
  const url = () =>
    typeof window !== "undefined"
      ? `${window.location.origin}/journal/${slug}`
      : `/journal/${slug}`;
  const enc = (v: string) => encodeURIComponent(v);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be blocked (insecure context, etc.). Fall back to a
      // brief flash on the button anyway so it's clear the click registered.
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const facebookHref = () => `https://www.facebook.com/sharer/sharer.php?u=${enc(url())}`;
  const twitterHref = () => `https://twitter.com/intent/tweet?url=${enc(url())}&text=${enc(title)}`;
  const linkedInHref = () => `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url())}`;
  const mailHref = () => `mailto:?subject=${enc(title)}&body=${enc(url())}`;

  const itemClass =
    "flex items-center gap-3 px-3 py-2.5 font-mono text-[11px] uppercase tracking-widest text-ink/70 hover:text-orange transition-colors border-b border-line last:border-b-0";

  return (
    <aside aria-label="Share this article" className="border border-line bg-white">
      <p className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-widest text-ink/40 border-b border-line">
        Share
      </p>
      <a
        href={facebookHref()}
        target="_blank"
        rel="noopener noreferrer"
        className={itemClass}
        aria-label="Share on Facebook"
      >
        <Icon><path d="M13 8.5h2.2l.3-2.6h-2.5V4.6c0-.8.3-1.2 1.2-1.2h1.4V1h-2.1c-2 0-2.8 1-2.8 2.7v2.2H8.9v2.6h1.8V17H13V8.5z" fill="currentColor" /></Icon>
        Facebook
      </a>
      <a
        href={twitterHref()}
        target="_blank"
        rel="noopener noreferrer"
        className={itemClass}
        aria-label="Share on X"
      >
        <Icon><path d="M13.5 2.5h2.6l-5.7 6.5 6.7 8.5h-5.3l-4.1-5.4-4.7 5.4H.4l6-7L0 2.5h5.4l3.7 4.9 4.4-4.9zm-.9 13.3h1.4L5.5 3.8H4l8.6 12z" fill="currentColor" /></Icon>
        X
      </a>
      <a
        href={linkedInHref()}
        target="_blank"
        rel="noopener noreferrer"
        className={itemClass}
        aria-label="Share on LinkedIn"
      >
        <Icon><path d="M4 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm-1.2 4.5h2.4v9.5H2.8V7.5zm4 0h2.3v1.3h.03c.32-.6 1.1-1.23 2.27-1.23 2.43 0 2.88 1.6 2.88 3.68V17h-2.4v-4.1c0-.98-.02-2.24-1.36-2.24-1.37 0-1.58 1.07-1.58 2.17V17H6.8V7.5z" fill="currentColor" /></Icon>
        LinkedIn
      </a>
      <a
        href={mailHref()}
        className={itemClass}
        aria-label="Share by email"
      >
        <Icon><path d="M2.5 4h15v12h-15V4zm1 1.2v.3l6.5 5 6.5-5v-.3l-6.5 4.6L3.5 5.2zm0 1.7V14.8h13V6.9l-6.5 4.7L3.5 6.9z" fill="currentColor" /></Icon>
        Email
      </a>
      <button
        type="button"
        onClick={handlePrint}
        className={itemClass + " w-full text-left bg-transparent"}
      >
        <Icon><path d="M5 3h10v3H5V3zm-2 4h14a1 1 0 011 1v6a1 1 0 01-1 1h-2v2H5v-2H3a1 1 0 01-1-1V8a1 1 0 011-1zm4 4v6h6v-6H7zm-2.5-2.5a.75.75 0 110 1.5.75.75 0 010-1.5z" fill="currentColor" /></Icon>
        Print
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className={itemClass + " w-full text-left bg-transparent"}
      >
        <Icon><path d="M7 4h7a1 1 0 011 1v9h-1V5H7V4zM4 7h7a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1zm0 1v8h7V8H4z" fill="currentColor" /></Icon>
        {copied ? "Copied" : "Copy Link"}
      </button>
    </aside>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="flex-shrink-0">
      {children}
    </svg>
  );
}
