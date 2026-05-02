"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckIcon } from "@/components/icons";

interface MemberSignupFormProps {
  tone?: "light" | "dark";
  className?: string;
}

export function MemberSignupForm({ tone = "dark", className }: MemberSignupFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [interestType, setInterestType] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const isDark = tone === "dark";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/circle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, email, interest_type: interestType || null }),
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
      <div className={cn("flex flex-col items-center text-center gap-4 py-8", className)}>
        <div className="w-10 h-10 rounded-full bg-orange flex items-center justify-center">
          <CheckIcon size={18} className="text-white" />
        </div>
        <p className={cn("font-display text-card-lg font-light", isDark ? "text-ink-light" : "text-navy")}>
          Welcome to the circle.
        </p>
        <p className={cn("font-sans text-body-md", isDark ? "text-ink-light/60" : "text-ink/60")}>
          You'll receive early access to new launches before they reach the market.
        </p>
      </div>
    );
  }

  const inputClass = cn(
    "w-full font-sans text-body-md px-3 py-2.5 outline-none transition-colors",
    isDark
      ? "bg-white/5 border border-line-dark text-ink-light placeholder:text-ink-light/30 focus:border-orange/60"
      : "bg-white border border-line text-ink placeholder:text-ink/30 focus:border-orange/60"
  );

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-3", className)}>
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
      <select
        value={interestType}
        onChange={(e) => setInterestType(e.target.value)}
        className={cn(inputClass, "cursor-pointer")}
        aria-label="I am a..."
      >
        <option value="">I am a...</option>
        <option value="Owner-occupier">Owner-occupier</option>
        <option value="Investor">Investor</option>
        <option value="Developer">Developer</option>
        <option value="Agent">Agent</option>
      </select>

      {error && <p className="font-sans text-body-md text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange text-white font-mono text-label-lg uppercase tracking-widest py-3 hover:bg-orange/90 transition-colors disabled:opacity-60 mt-1"
      >
        {loading ? "Joining…" : "Join the circle"}
      </button>

      <p className={cn("font-mono text-label-sm text-center", isDark ? "text-ink-light/30" : "text-ink/30")}>
        Free. No spam. Unsubscribe any time.
      </p>
    </form>
  );
}
