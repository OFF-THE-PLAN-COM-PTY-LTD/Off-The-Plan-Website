"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ShareModalProps {
  slug: string;
  /**
   * Category slug for the canonical listing URL (e.g. "townhouses"). When
   * omitted, the URL falls back to /listings/<slug>, which 301-redirects to
   * the canonical category — so sharing still works, just with one hop.
   */
  category?: string;
  name: string;
  suburb?: string | null;
  state?: string | null;
  onClose: () => void;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

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

function InstagramSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="15" height="15" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="3.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14.75" cy="5.25" r="0.9" fill="currentColor" />
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

function LinkSvg() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M8.5 11.5a4.5 4.5 0 006.364 0l2-2a4.5 4.5 0 00-6.364-6.364L9.25 4.386" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11.5 8.5a4.5 4.5 0 00-6.364 0l-2 2a4.5 4.5 0 006.364 6.364L10.75 15.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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

// ── Component ─────────────────────────────────────────────────────────────────

export function ShareModal({ slug, category, name, suburb, state, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const path = `/${category ?? "listings"}/${slug}`;
  const listingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${path}`
      : `https://offtheplan.com.au${path}`;

  // Mount portal target
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Animate in
  useEffect(() => {
    if (!mounted) return;
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [mounted]);

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

  const handleInstagram = () => {
    // Use native Web Share API on mobile (shows Instagram etc.), else copy
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: name, url: listingUrl }).catch(() => copyUrl());
    } else {
      copyUrl();
    }
  };

  const location = [suburb, state].filter(Boolean).join(", ");

  const socialOptions = [
    {
      label: "Email",
      bg: "bg-navy",
      icon: <EmailSvg />,
      onClick: () => {
        window.open(
          `mailto:?subject=${encodeURIComponent(`${name} – Off The Plan`)}&body=${encodeURIComponent(`I found this listing you might like:\n\n${name}${location ? ` · ${location}` : ""}\n\n${listingUrl}`)}`,
          "_blank",
        );
      },
    },
    {
      label: "Facebook",
      bg: "bg-[#1877F2]",
      icon: <FacebookSvg />,
      onClick: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(listingUrl)}`,
          "_blank",
          "width=600,height=400",
        );
      },
    },
    {
      label: "Instagram",
      bg: "",
      gradientStyle: {
        background:
          "linear-gradient(45deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)",
      },
      icon: <InstagramSvg />,
      onClick: handleInstagram,
    },
    {
      label: "WhatsApp",
      bg: "bg-[#25D366]",
      icon: <WhatsAppSvg />,
      onClick: () => {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${name}${location ? ` · ${location}` : ""}\n${listingUrl}`)}`,
          "_blank",
        );
      },
    },
  ];

  if (!mounted) return null;

  const content = (
    // ── Overlay — no backdrop-blur (avoids GPU conflict with card hover transforms)
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-200",
        visible ? "opacity-100 bg-black/60" : "opacity-0 bg-black/0 pointer-events-none",
      )}
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
      aria-label="Share listing"
    >
      {/* Modal */}
      <div
        className={cn(
          "flex w-full max-w-[520px] overflow-hidden shadow-[0_32px_64px_-8px_rgba(0,0,0,0.5)] transition-all duration-200",
          visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-3",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Left: brand panel ───────────────────────────────────────────── */}
        <div className="hidden sm:flex flex-col bg-navy w-[200px] flex-shrink-0 px-6 py-7">

          {/* Logo — white badge so dark-on-light PNG renders correctly */}
          <div className="bg-white p-3 mb-auto w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Off The Plan"
              className="w-full object-contain"
            />
          </div>

          {/* Middle: tagline */}
          <div className="py-7">
            <div className="w-8 h-px bg-orange mb-4" aria-hidden="true" />
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/70 leading-[2.1]">
              Australia&apos;s<br />New Home<br />Portal
            </p>
          </div>

          {/* Bottom: share tagline */}
          <div className="border-t border-white/15 pt-5">
            <p className="font-display font-light italic text-white text-[16px] leading-snug">
              Share your<br />future address
            </p>
          </div>
        </div>

        {/* ── Right: content ──────────────────────────────────────────────── */}
        <div className="flex-1 bg-white relative flex flex-col min-w-0">
          {/* Close */}
          <button
            onClick={handleClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-1.5 text-ink/25 hover:text-ink/60 transition-colors z-10"
          >
            <CloseSvg />
          </button>

          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-line">
            <div className="flex items-center gap-2 mb-2">
              <span className="block w-5 h-px bg-orange flex-shrink-0" aria-hidden="true" />
              <p className="font-mono text-[9px] uppercase tracking-widest text-orange/80">Share Listing</p>
            </div>
            <h2 className="font-display font-light text-navy text-[1.3rem] leading-tight pr-6">
              {name}
            </h2>
            {location && (
              <p className="font-sans text-[12px] text-ink/40 mt-0.5">{location}</p>
            )}
          </div>

          {/* Social buttons: 4 in a row */}
          <div className="px-6 pt-5 pb-4">
            <p className="font-mono text-[9px] uppercase tracking-widest text-ink/30 mb-3">Share via</p>
            <div className="grid grid-cols-4 gap-2">
              {socialOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={opt.onClick}
                  className="group flex flex-col items-center gap-2 py-3 px-1 border border-line hover:border-orange hover:bg-orange/5 transition-all duration-200"
                >
                  <span
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                      opt.bg,
                    )}
                    style={opt.gradientStyle}
                  >
                    {opt.icon}
                  </span>
                  <span className="font-mono text-[8.5px] uppercase tracking-widest text-ink/40 group-hover:text-orange transition-colors leading-none">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Copy link — full width prominent bar */}
          <div className="px-6 pb-5">
            <button
              onClick={copyUrl}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 border transition-all duration-200",
                copied
                  ? "border-orange bg-orange/5 text-orange"
                  : "border-line hover:border-orange hover:bg-orange/5 text-ink/50",
              )}
            >
              <span
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200",
                  copied ? "bg-orange text-white" : "bg-ink/8 text-ink/40",
                )}
              >
                <LinkSvg />
              </span>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-mono text-[9px] uppercase tracking-widest mb-0.5 text-current">
                  {copied ? "Link copied!" : "Copy link"}
                </p>
                <p className="font-sans text-[11px] text-ink/40 truncate">{listingUrl}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
