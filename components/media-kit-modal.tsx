"use client";

import { useEffect, useState } from "react";

/**
 * Modal-based "Request Media Kit" form. Replaces the previous mailto: link
 * which dumped users into their default mail client (Tim's PDF I18: "doesn't
 * behave like legacy"). POSTs to /api/media-kit-request which emails admin
 * + sales@ with the submitter's details. Reply-To is set to the submitter
 * so a single reply goes straight back to them.
 */
export function MediaKitModal({ buttonClassName, label = "Request Media Kit" }: { buttonClassName?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Close on Esc and lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      full_name: String(fd.get("full_name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim() || null,
      company: String(fd.get("company") ?? "").trim() || null,
      category: String(fd.get("category") ?? "").trim() || null,
      state: String(fd.get("state") ?? "").trim() || null,
    };
    try {
      const res = await fetch("/api/media-kit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErrorMsg(j.error ?? "Could not send. Please try again.");
        setStatus("err");
        return;
      }
      setStatus("ok");
      (e.target as HTMLFormElement).reset();
    } catch {
      setErrorMsg("Could not send. Please try again.");
      setStatus("err");
    }
  }

  function close() {
    setOpen(false);
    // Reset after the closing transition so re-opening is clean.
    setTimeout(() => { setStatus("idle"); setErrorMsg(null); }, 200);
  }

  const inp =
    "w-full border border-line bg-white px-3 py-2 font-sans text-sm text-ink outline-none focus:border-orange/60";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClassName ?? "font-mono text-[10px] uppercase tracking-widest bg-orange text-white px-6 py-2.5 hover:bg-orange/90 transition-colors"}
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Request Media Kit"
        >
          <div
            className="bg-cream max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-navy px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-orange mb-1">
                  Media Kit
                </p>
                <p className="font-display font-light text-white text-xl leading-tight">
                  Request Media Kit
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={close}
                className="font-mono text-white/60 hover:text-white text-xl px-2"
              >
                ×
              </button>
            </div>

            {status === "ok" ? (
              <div className="p-6">
                <p className="font-display font-light text-navy text-lg mb-2">Thanks — we&apos;ll be in touch.</p>
                <p className="font-sans text-sm text-ink/65">
                  Your request has been sent to our team. We&apos;ll get the media kit across to you shortly.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-5 font-mono text-[10px] uppercase tracking-widest px-5 py-2.5 bg-navy text-white hover:bg-navy/90 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <p className="font-sans text-sm text-ink/65">
                  Tell us a bit about you and we&apos;ll send the latest Off The Plan media kit straight to your inbox.
                </p>

                <div>
                  <label className="block font-sans text-xs text-ink/60 mb-1">Your name</label>
                  <input name="full_name" type="text" required maxLength={120} className={inp} />
                </div>
                <div>
                  <label className="block font-sans text-xs text-ink/60 mb-1">Email</label>
                  <input name="email" type="email" required maxLength={200} className={inp} />
                </div>
                <div>
                  <label className="block font-sans text-xs text-ink/60 mb-1">Phone (optional)</label>
                  <input name="phone" type="tel" maxLength={40} className={inp} />
                </div>
                <div>
                  <label className="block font-sans text-xs text-ink/60 mb-1">Company (optional)</label>
                  <input name="company" type="text" maxLength={120} className={inp} />
                </div>
                <div>
                  <label className="block font-sans text-xs text-ink/60 mb-1">Which type of property are you marketing?</label>
                  <select name="category" required className={`${inp} cursor-pointer`} defaultValue="">
                    <option value="" disabled>Category</option>
                    <option value="New Apartments">New Apartments</option>
                    <option value="Townhouses">Townhouses</option>
                    <option value="Land and Estates">Land and Estates</option>
                    <option value="Commercial">Commercial</option>
                    <option value="House & Land">House &amp; Land</option>
                    <option value="Over 55's / Retirement">Over 55&apos;s / Retirement</option>
                  </select>
                </div>
                <div>
                  <label className="block font-sans text-xs text-ink/60 mb-1">Where is your property located?</label>
                  <select name="state" required className={`${inp} cursor-pointer`} defaultValue="">
                    <option value="" disabled>State</option>
                    <option value="Australian Capital Territory">Australian Capital Territory</option>
                    <option value="New South Wales">New South Wales</option>
                    <option value="Northern Territory">Northern Territory</option>
                    <option value="Queensland">Queensland</option>
                    <option value="South Australia">South Australia</option>
                    <option value="Tasmania">Tasmania</option>
                    <option value="Victoria">Victoria</option>
                    <option value="Western Australia">Western Australia</option>
                  </select>
                </div>

                {errorMsg && <p className="font-sans text-sm text-red-600">{errorMsg}</p>}

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="font-mono text-[11px] uppercase tracking-widest px-6 py-2.5 bg-orange text-white hover:bg-orange/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {status === "sending" ? "Sending…" : "Send request"}
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="font-mono text-[11px] uppercase tracking-widest px-4 py-2.5 border border-line text-ink/60 hover:border-ink hover:text-ink transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
