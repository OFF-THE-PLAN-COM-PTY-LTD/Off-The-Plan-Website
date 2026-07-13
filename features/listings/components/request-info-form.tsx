"use client";

import { useState } from "react";

interface RequestInfoFormProps {
  developmentName: string;
  developmentId: string;
}

export function RequestInfoForm({ developmentName, developmentId }: RequestInfoFormProps) {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const first = (fd.get("first_name") as string)?.trim() ?? "";
    const last = (fd.get("last_name") as string)?.trim() ?? "";
    const fullName = `${first} ${last}`.trim();
    const postcode = (fd.get("postcode") as string)?.trim() ?? "";
    const describe = (fd.get("describe_yourself") as string)?.trim() ?? "";
    const message = (fd.get("message") as string)?.trim() ?? "";

    const notesParts = [
      postcode && `Postcode: ${postcode}`,
      message && `Message: ${message}`,
      developmentName && `Listing: ${developmentName}`,
    ].filter(Boolean);

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          development_id: developmentId,
          full_name: fullName,
          email: fd.get("email"),
          mobile: fd.get("phone"),
          buyer_type: describe || null,
          notes: notesParts.join(" | ") || null,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Could not send your enquiry. Please try again.");
      }
      setSent(true);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="font-sans text-body-md text-orange text-center">
          Thanks! We've received your enquiry and will be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="development_id" value={developmentId} />
      <input type="hidden" name="development_name" value={developmentName} />

      {error && (
        <p className="font-sans text-body-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <input
          name="first_name"
          type="text"
          placeholder="First Name*"
          required
          className="border border-line px-3 py-2.5 font-sans text-[13px] text-ink outline-none focus:border-navy/50 bg-white placeholder:text-ink/40"
        />
        <input
          name="last_name"
          type="text"
          placeholder="Last Name*"
          required
          className="border border-line px-3 py-2.5 font-sans text-[13px] text-ink outline-none focus:border-navy/50 bg-white placeholder:text-ink/40"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          name="email"
          type="email"
          placeholder="Email Address*"
          required
          className="border border-line px-3 py-2.5 font-sans text-[13px] text-ink outline-none focus:border-navy/50 bg-white placeholder:text-ink/40"
        />
        <input
          name="phone"
          type="tel"
          placeholder="Phone Number*"
          required
          className="border border-line px-3 py-2.5 font-sans text-[13px] text-ink outline-none focus:border-navy/50 bg-white placeholder:text-ink/40"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          name="postcode"
          type="text"
          placeholder="Postcode*"
          required
          className="border border-line px-3 py-2.5 font-sans text-[13px] text-ink outline-none focus:border-navy/50 bg-white placeholder:text-ink/40"
        />
        <select
          name="describe_yourself"
          required
          className="border border-line px-3 py-2.5 font-sans text-[13px] text-ink/50 outline-none focus:border-navy/50 bg-white cursor-pointer"
        >
          <option value="">Describe Yourself*</option>
          {["Buyer", "Investor", "First Home Buyer", "Downsizer", "Agent", "Developer", "Other"].map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      <textarea
        name="message"
        placeholder="Message*"
        rows={5}
        required
        className="border border-line px-3 py-2.5 font-sans text-[13px] text-ink outline-none focus:border-navy/50 bg-white placeholder:text-ink/40 resize-none"
      />

      <div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest px-8 py-3 bg-navy text-white hover:bg-orange transition-colors disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Send"}
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 8h12M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </form>
  );
}
