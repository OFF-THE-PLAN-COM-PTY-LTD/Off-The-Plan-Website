"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const inp =
  "w-full border border-line px-3 py-2 text-sm font-sans text-ink focus:outline-none focus:border-navy";
const lbl = "font-sans text-xs text-ink/40 uppercase tracking-wider mb-1 block";

const STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

interface Values {
  org_name: string;
  type: "Developer" | "Agent";
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  org_phone: string;
  org_state: string;
}

const EMPTY: Values = {
  org_name: "",
  type: "Agent",
  first_name: "",
  last_name: "",
  email: "",
  mobile: "",
  org_phone: "",
  org_state: "",
};

/**
 * Trimmed create form for /admin/agencies/new ("All Profiles" → + Add profile).
 *
 * Only carries the fields needed for a valid `accounts` row; logos, socials and
 * address detail are filled in afterwards on the existing edit page. That split
 * is deliberate — the edit page's logo uploader PATCHes the moment a file is
 * chosen, which cannot work before the record exists.
 */
export default function NewProfileForm() {
  const router = useRouter();
  const [form, setForm] = useState<Values>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.org_name.trim()) {
      setError("Company name is required.");
      return;
    }
    // Mirror the server's check so the admin gets the error before the round
    // trip; the API validates independently and stays the source of truth.
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/agencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_name: form.org_name.trim(),
          type: form.type,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim(),
          mobile: form.mobile.trim(),
          org_phone: form.org_phone.trim(),
          org_state: form.org_state,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create profile");

      // Straight to the edit page — the admin almost always wants to add the
      // logo and the rest of the detail right away.
      router.push(`/admin/agencies/${json.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create profile");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="bg-white border border-line p-6">
        <p className="font-sans text-sm text-ink/60 mb-6">
          Creates the company record only — no login is created and no email is sent.
          You can add a logo, socials and address on the next screen.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="col-span-2">
            <label className={lbl} htmlFor="org_name">Company Name *</label>
            <input
              id="org_name"
              type="text"
              value={form.org_name}
              onChange={(e) => set("org_name", e.target.value)}
              placeholder="e.g. Harbour Property Group"
              className={inp}
              autoFocus
            />
          </div>

          <div>
            <label className={lbl} htmlFor="type">Type *</label>
            <select
              id="type"
              value={form.type}
              onChange={(e) => set("type", e.target.value as Values["type"])}
              className={inp + " cursor-pointer"}
            >
              <option value="Agent">Agent</option>
              <option value="Developer">Developer</option>
            </select>
          </div>
          <div>
            <label className={lbl} htmlFor="org_state">State</label>
            <select
              id="org_state"
              value={form.org_state}
              onChange={(e) => set("org_state", e.target.value)}
              className={inp + " cursor-pointer"}
            >
              <option value="">— Select —</option>
              {STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={lbl} htmlFor="first_name">Contact First Name</label>
            <input
              id="first_name"
              type="text"
              value={form.first_name}
              onChange={(e) => set("first_name", e.target.value)}
              className={inp}
            />
          </div>
          <div>
            <label className={lbl} htmlFor="last_name">Contact Last Name</label>
            <input
              id="last_name"
              type="text"
              value={form.last_name}
              onChange={(e) => set("last_name", e.target.value)}
              className={inp}
            />
          </div>

          <div className="col-span-2">
            <label className={lbl} htmlFor="email">Contact Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="e.g. sales@harbourproperty.com.au"
              className={inp}
            />
          </div>

          <div>
            <label className={lbl} htmlFor="mobile">Mobile</label>
            <input
              id="mobile"
              type="tel"
              value={form.mobile}
              onChange={(e) => set("mobile", e.target.value)}
              className={inp}
            />
          </div>
          <div>
            <label className={lbl} htmlFor="org_phone">Company Phone</label>
            <input
              id="org_phone"
              type="tel"
              value={form.org_phone}
              onChange={(e) => set("org_phone", e.target.value)}
              className={inp}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="font-sans text-sm text-red-600 mb-4">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="font-sans text-xs font-semibold px-5 py-2 bg-black text-white uppercase tracking-widest hover:bg-ink/80 transition-colors disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create profile"}
          </button>
          <Link
            href="/admin/agencies"
            className="font-sans text-sm text-ink/40 hover:text-ink transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}
