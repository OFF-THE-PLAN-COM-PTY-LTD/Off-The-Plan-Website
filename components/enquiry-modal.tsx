"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface EnquiryModalProps {
  developmentId: string;
  developmentName: string;
  developerName?: string | null;
  developerLogoUrl?: string | null;
  onClose: () => void;
}

type BuyerType =
  | "First Home Buyer"
  | "Owner Occupant"
  | "Investor"
  | "Foreign Investor"
  | "Buyers Agent";

const BUYER_TYPES: BuyerType[] = [
  "First Home Buyer",
  "Owner Occupant",
  "Investor",
  "Foreign Investor",
  "Buyers Agent",
];

const AU_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

function CloseSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function EnquiryModal({
  developmentId,
  developmentName,
  developerName,
  developerLogoUrl,
  onClose,
}: EnquiryModalProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [stateResiding, setStateResiding] = useState("");
  const [buyerType, setBuyerType] = useState<BuyerType | "">("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [mounted]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 180);
  }, [onClose]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [handleClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          development_id: developmentId,
          full_name: name,
          email,
          mobile: phone,
          buyer_type: buyerType || null,
          notes: message,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Something went wrong");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const inputClass =
    "w-full border border-[#d0d0d0] bg-white text-[13px] text-ink font-sans px-3 py-2 outline-none focus:border-orange/60 transition-colors placeholder:text-ink/35";

  const content = (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-200",
        visible ? "opacity-100 bg-black/60" : "opacity-0 bg-black/0 pointer-events-none",
      )}
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
      aria-label="Send enquiry"
    >
      <div
        className={cn(
          "flex w-full max-w-[680px] max-h-[90vh] overflow-hidden shadow-[0_32px_64px_-8px_rgba(0,0,0,0.5)] transition-all duration-200",
          visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-3",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Left: brand panel ── */}
        <div className="hidden sm:flex flex-col bg-navy w-[220px] flex-shrink-0 px-6 py-8">
          {/* Logo */}
          <div className="bg-white p-3 w-full mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Off The Plan" className="w-full object-contain" />
          </div>

          {/* Middle: brand statement. Tagline removed per Jun 2026
              client feedback; bumped the headline + portal label sizes
              up to make better use of the freed-up vertical space. */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="w-8 h-px bg-orange mb-5" aria-hidden="true" />
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/55 leading-[2] mb-6">
              Australia&apos;s<br />New Home<br />Portal
            </p>
            <p className="font-display font-light text-white text-[1.5rem] leading-tight">
              Australia&apos;s finest{" "}
              <em className="not-italic italic text-orange">off&#8209;the&#8209;plan</em>{" "}
              properties.
            </p>
          </div>

          {/* Bottom */}
          <div className="border-t border-white/15 pt-5 mt-8">
            <p className="font-display font-light italic text-white text-[1.05rem] leading-snug">
              Speak with<br />a specialist
            </p>
          </div>
        </div>

        {/* ── Right: form ── */}
        <div className="flex-1 bg-white flex flex-col min-w-0 overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#e8e8e8] flex-shrink-0">
            <h2 className="font-display font-light text-navy text-[1.6rem] leading-tight">
              Send Enquiry
            </h2>
            <button
              onClick={handleClose}
              aria-label="Close"
              className="p-1.5 text-ink/25 hover:text-ink/60 transition-colors mt-1"
            >
              <CloseSvg />
            </button>
          </div>

          {success ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-orange flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M4 10l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="font-display font-light text-navy text-[1.3rem]">Enquiry received</h3>
              <p className="font-sans text-[13px] text-ink/60 max-w-xs">
                A specialist will be in touch within 24 hours regarding{" "}
                <strong className="text-ink">{developmentName}</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-5">

              {/* Agent mini-card — single card, no truncation. The
                  hardcoded "18 **********" placeholder phone was removed
                  (Jun 2026 client feedback: never connected to real
                  data, was the same string on every listing). The
                  duplicate card render was also removed — was showing
                  two identical cards via [0,1].map. */}
              {developerName && (
                <div className="flex items-center gap-3">
                  {developerLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={developerLogoUrl}
                      alt={developerName}
                      className="w-10 h-10 object-contain border border-[#e0e0e0] p-1 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-navy/8 border border-[#e0e0e0] flex items-center justify-center flex-shrink-0">
                      <span className="font-mono text-[7px] uppercase text-ink/40">
                        {developerName.slice(0, 2)}
                      </span>
                    </div>
                  )}
                  <p className="font-sans font-semibold text-[13px] text-ink leading-snug">
                    {developerName} Sales Team
                  </p>
                </div>
              )}

              {/* Contact details */}
              <div>
                <p className="font-sans text-[12px] font-semibold text-ink mb-2">
                  Your Contact Details <span className="text-orange">*</span>
                </p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    aria-label="Name"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                    aria-label="Phone"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(inputClass, "w-full")}
                  aria-label="Email"
                />
              </div>

              {/* State */}
              <div>
                <p className="font-sans text-[12px] font-semibold text-ink mb-2">
                  State You Reside <span className="text-orange">*</span>
                </p>
                <select
                  required
                  value={stateResiding}
                  onChange={(e) => setStateResiding(e.target.value)}
                  className={cn(inputClass, "cursor-pointer")}
                  aria-label="State you reside"
                >
                  <option value="">State</option>
                  {AU_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Buyer type radio grid */}
              <div>
                <p className="font-sans text-[12px] font-semibold text-ink mb-2">
                  What Best Describes You <span className="text-orange">*</span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {BUYER_TYPES.map((type) => (
                    <label
                      key={type}
                      className={cn(
                        "flex items-center gap-2 border px-3 py-2 cursor-pointer transition-colors text-[12px] font-sans",
                        buyerType === type
                          ? "border-orange bg-orange/5 text-orange"
                          : "border-[#d0d0d0] text-ink/70 hover:border-ink/40",
                      )}
                    >
                      <input
                        type="radio"
                        name="buyerType"
                        value={type}
                        checked={buyerType === type}
                        onChange={() => setBuyerType(type)}
                        className="accent-orange flex-shrink-0"
                        required={buyerType === ""}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <p className="font-sans text-[12px] font-semibold text-ink mb-2">Your Message</p>
                <textarea
                  placeholder=""
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className={cn(inputClass, "resize-none")}
                  aria-label="Your message"
                />
              </div>

              {error && (
                <p className="font-sans text-[12px] text-red-500">{error}</p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-1 pb-2">
                <p className="font-sans text-[11px] text-ink/40">
                  View our:{" "}
                  <a href="/privacy" target="_blank" className="text-orange hover:underline">
                    Privacy Policy
                  </a>{" "}
                  or{" "}
                  <a href="/terms-and-conditions.pdf" target="_blank" rel="noopener" className="text-orange hover:underline">
                    Terms &amp; Conditions
                  </a>
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-shrink-0 bg-orange text-white font-mono text-[11px] uppercase tracking-widest px-8 py-2.5 hover:bg-orange/90 transition-colors disabled:opacity-60"
                >
                  {loading ? "Sending…" : "Send"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
