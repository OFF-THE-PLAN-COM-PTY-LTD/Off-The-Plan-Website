"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ShareModalProps {
  slug: string;
  name: string;
  suburb?: string | null;
  state?: string | null;
  onClose: () => void;
}

// ── Social icons ────────────────────────────────────────────────────────────

function EmailSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="16" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 6.5L10 12L18 6.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function FacebookSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M17 10a7 7 0 10-8.094 6.914V12.41H7.12V10h1.786V8.417c0-1.763 1.05-2.737 2.657-2.737.77 0 1.575.137 1.575.137v1.731h-.887c-.874 0-1.147.543-1.147 1.1V10h1.953l-.312 2.41h-1.641v4.504A7.003 7.003 0 0017 10z" />
    </svg>
  );
}

function WhatsAppSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M10 2C5.582 2 2 5.582 2 10c0 1.476.39 2.862 1.07 4.063L2 18l4.063-1.063A7.952 7.952 0 0010 18c4.418 0 8-3.582 8-8s-3.582-8-8-8zm-3.293 5.028c.147-.003.307.004.458.344.165.376.558 1.363.607 1.462.05.1.083.217.017.35-.067.13-.1.21-.2.323-.1.113-.21.253-.3.34-.1.088-.204.185-.088.363.117.18.518.855 1.112 1.385.765.681 1.41.892 1.612.99.2.1.317.083.433-.05.117-.133.5-.583.633-.783.133-.2.267-.167.45-.1.183.067 1.167.55 1.367.65.2.1.333.15.383.233.05.083.05.483-.117.95-.166.466-.966.9-1.35.933-.385.033-.75.183-2.517-.533-2.117-.85-3.45-3.017-3.55-3.167-.1-.15-.817-1.083-.817-2.067 0-.983.517-1.467.7-1.667.183-.2.4-.25.533-.25z" />
    </svg>
  );
}

function CopySvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13 7V4a1 1 0 00-1-1H4a1 1 0 00-1 1v8a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CloseSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function ShareModal({ slug, name, suburb, state, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  const listingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/listings/${slug}`
      : `https://offtheplan.com.au/listings/${slug}`;

  // Animate in on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Escape key
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 180);
  }, [onClose]);

  const copyUrl = () => {
    navigator.clipboard.writeText(listingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const location = [suburb, state].filter(Boolean).join(", ");

  const shareOptions = [
    {
      label: "Email",
      bg: "bg-navy",
      icon: <EmailSvg />,
      href: `mailto:?subject=${encodeURIComponent(`${name} – Off The Plan`)}&body=${encodeURIComponent(`I found this listing you might like:\n\n${name}${location ? ` · ${location}` : ""}\n\n${listingUrl}`)}`,
    },
    {
      label: "Facebook",
      bg: "bg-[#1877F2]",
      icon: <FacebookSvg />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(listingUrl)}`,
    },
    {
      label: "WhatsApp",
      bg: "bg-[#25D366]",
      icon: <WhatsAppSvg />,
      href: `https://wa.me/?text=${encodeURIComponent(`${name}${location ? ` · ${location}` : ""}\n${listingUrl}`)}`,
    },
  ];

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200",
        visible ? "bg-black/55 backdrop-blur-sm" : "bg-transparent pointer-events-none",
      )}
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
      aria-label="Share listing"
    >
      <div
        className={cn(
          "flex w-full max-w-[520px] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.45)] transition-all duration-200",
          visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-3",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Left: brand panel ─────────────────────────────────────────── */}
        <div className="hidden sm:flex flex-col justify-between bg-navy p-7 w-[168px] flex-shrink-0">
          {/* Logo lockup */}
          <div>
            <div className="border border-white/20 px-3 py-3 inline-block mb-4">
              <p className="font-mono text-[7px] uppercase tracking-[0.28em] text-white/50 leading-none">OFF</p>
              <div className="w-full h-[0.5px] bg-white/20 my-2" />
              <p className="font-display text-[18px] font-light italic text-white leading-none tracking-tight">The</p>
              <div className="w-full h-[0.5px] bg-white/20 my-2" />
              <p className="font-mono text-[7px] uppercase tracking-[0.28em] text-white/50 leading-none">PLAN</p>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="block w-4 h-px bg-orange" aria-hidden="true" />
              <p className="font-mono text-[7px] uppercase tracking-[0.2em] text-orange/80">Australia</p>
            </div>
            <p className="font-mono text-[7px] uppercase tracking-[0.15em] text-white/25 leading-[1.9]">
              New Home<br />Portal
            </p>
          </div>
          {/* Bottom tagline */}
          <p className="font-display font-light italic text-white/20 text-[12px] leading-snug">
            Share your<br />future address
          </p>
        </div>

        {/* ── Right: content ────────────────────────────────────────────── */}
        <div className="flex-1 bg-white relative flex flex-col">
          {/* Close */}
          <button
            onClick={handleClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-1.5 text-ink/25 hover:text-ink/70 transition-colors"
          >
            <CloseSvg />
          </button>

          {/* Header */}
          <div className="px-6 pt-6 pb-5 border-b border-line">
            <div className="flex items-center gap-2 mb-2">
              <span className="block w-5 h-px bg-orange flex-shrink-0" aria-hidden="true" />
              <p className="font-mono text-[9px] uppercase tracking-widest text-orange/80">Share Listing</p>
            </div>
            <h2 className="font-display font-light text-navy text-[1.35rem] leading-tight pr-6">
              {name}
            </h2>
            {location && (
              <p className="font-sans text-[12px] text-ink/40 mt-0.5">{location}</p>
            )}
          </div>

          {/* Share options */}
          <div className="px-6 pt-5 pb-4">
            <p className="font-mono text-[9px] uppercase tracking-widest text-ink/30 mb-3">Share via</p>
            <div className="grid grid-cols-4 gap-2.5">
              {shareOptions.map((opt) => (
                <a
                  key={opt.label}
                  href={opt.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-2 py-3 px-2 border border-line hover:border-orange hover:bg-orange/5 transition-all duration-200"
                >
                  <span
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0",
                      "transition-transform duration-200 group-hover:scale-110",
                      opt.bg,
                    )}
                  >
                    {opt.icon}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-ink/45 group-hover:text-orange transition-colors">
                    {opt.label}
                  </span>
                </a>
              ))}

              {/* Copy link */}
              <button
                onClick={copyUrl}
                className="group flex flex-col items-center gap-2 py-3 px-2 border border-line hover:border-orange hover:bg-orange/5 transition-all duration-200"
              >
                <span
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110",
                    copied
                      ? "bg-orange text-white"
                      : "bg-ink/8 text-ink/50 group-hover:bg-orange group-hover:text-white",
                  )}
                >
                  <CopySvg />
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-ink/45 group-hover:text-orange transition-colors">
                  {copied ? "Copied!" : "Copy"}
                </span>
              </button>
            </div>
          </div>

          {/* URL field */}
          <div className="px-6 pb-6 mt-auto">
            <p className="font-mono text-[9px] uppercase tracking-widest text-ink/30 mb-1.5">Listing URL</p>
            <button
              onClick={copyUrl}
              title="Click to copy"
              className="w-full text-left border border-line px-3 py-2.5 font-mono text-[11px] text-ink/50 bg-cream/60 hover:border-orange/60 hover:bg-orange/5 transition-all duration-200 truncate block"
            >
              {listingUrl}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
