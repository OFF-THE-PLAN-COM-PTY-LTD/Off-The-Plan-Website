"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckIcon } from "@/components/icons";

interface EnquiryFormProps {
  developmentId: string;
  developmentName: string;
  className?: string;
}

type BuyerType = "Owner-occupier" | "Investor" | "Developer" | "Agent";

export function EnquiryForm({ developmentId, developmentName, className }: EnquiryFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [buyerType, setBuyerType] = useState<BuyerType | "">("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

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
          full_name: fullName,
          email,
          mobile,
          buyer_type: buyerType || null,
          notes,
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

  if (success) {
    return (
      <div className={cn("bg-navy p-6 flex flex-col items-center text-center gap-4", className)}>
        <div className="w-10 h-10 rounded-full bg-orange flex items-center justify-center">
          <CheckIcon size={18} className="text-white" />
        </div>
        <h3 className="font-display text-card-lg font-light text-ink-light">Enquiry received</h3>
        <p className="font-sans text-body-md text-ink-light/60">
          A specialist will be in touch within 24 hours regarding <strong className="text-ink-light">{developmentName}</strong>.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full bg-white/5 border border-line-dark text-ink-light font-sans text-body-md px-3 py-2.5 outline-none focus:border-orange/60 transition-colors placeholder:text-ink-light/30";

  return (
    <div className={cn("bg-navy p-6", className)}>
      <p className="font-mono text-label-sm uppercase tracking-widest text-ink-light/40 mb-1">
        Enquire
      </p>
      <h3 className="font-display text-card-xl font-light text-ink-light mb-1">
        Speak with a Specialist
      </h3>
      <p className="font-mono text-label-sm text-ink-light/40 mb-5">
        Avg. response time: <span className="text-orange">4 hours</span>
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Full name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputClass}
          aria-label="Full name"
        />
        <input
          type="email"
          placeholder="Email address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          aria-label="Email address"
        />
        <input
          type="tel"
          placeholder="Mobile number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          className={inputClass}
          aria-label="Mobile number"
        />
        <select
          value={buyerType}
          onChange={(e) => setBuyerType(e.target.value as BuyerType | "")}
          className={cn(inputClass, "cursor-pointer")}
          aria-label="Buyer type"
        >
          <option value="" className="bg-navy">I am a...</option>
          <option value="Owner-occupier" className="bg-navy">Owner-occupier</option>
          <option value="Investor" className="bg-navy">Investor</option>
          <option value="Developer" className="bg-navy">Developer</option>
          <option value="Agent" className="bg-navy">Agent</option>
        </select>
        <textarea
          placeholder="Any questions? (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className={cn(inputClass, "resize-none")}
          aria-label="Notes or questions"
        />

        {error && (
          <p className="font-sans text-body-md text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange text-white font-mono text-label-lg uppercase tracking-widest py-3 hover:bg-orange/90 transition-colors disabled:opacity-60"
        >
          {loading ? "Sending…" : "Request price guide"}
        </button>
        <button
          type="button"
          onClick={() => {}}
          className="w-full border border-ink-light/20 text-ink-light font-mono text-label-lg uppercase tracking-widest py-3 hover:bg-white/5 transition-colors"
        >
          Book a private inspection
        </button>
      </form>
    </div>
  );
}
