"use client";

import { useState } from "react";

interface ProfileFormProps {
  fullName: string;
  email: string;
}

/**
 * Buyer account profile form. Note: we deliberately do NOT expose an
 * `interest_type` selector here — Developer/Agent membership is gated by
 * admin approval (apply via /list-a-listing), and exposing the field on the
 * client previously allowed any signed-in user to self-promote by PATCHing
 * the profile. The signup form sets interest_type once, and admins can
 * change it from /admin/members afterwards.
 */
export function ProfileForm({ fullName, email }: ProfileFormProps) {
  const [name, setName] = useState(fullName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: name }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Failed to save. Please try again.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  const inputClass = "w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className="section-label block mb-1.5">Full name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
      </div>
      <div>
        <label className="section-label block mb-1.5">Email</label>
        <input type="email" value={email} disabled className={inputClass + " bg-white/50 text-ink/40 cursor-not-allowed"} />
        <p className="mt-1 font-mono text-label-sm text-ink/30">Email cannot be changed here.</p>
      </div>

      {error && <p className="font-sans text-body-md text-red-600">{error}</p>}
      {saved && <p className="font-sans text-body-md text-green-600">Changes saved.</p>}

      <button type="submit" disabled={saving} className="btn-primary self-start">
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
