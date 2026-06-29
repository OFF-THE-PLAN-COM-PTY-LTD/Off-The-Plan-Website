"use client";

import { useState } from "react";
import Link from "next/link";

export default function ListWithUsPage() {
  const [role, setRole] = useState<"agency" | "developer">("agency");
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!agreed) return;
    setError(null);
    const fd = new FormData(e.currentTarget);
    const first = (fd.get("first_name") as string)?.trim() ?? "";
    const last = (fd.get("last_name") as string)?.trim() ?? "";
    const password = (fd.get("password") as string) ?? "";
    const confirm = (fd.get("confirm_password") as string) ?? "";

    // Client-side gate before round-tripping. Matches the server-side rules
    // but gives a clearer message than a generic 400.
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register-as-developer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          first_name: first,
          last_name: last,
          company: (fd.get("company") as string) ?? "",
          email: (fd.get("email") as string) ?? "",
          phone: (fd.get("phone") as string) ?? "",
          password,
          agreed,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Could not submit. Please try again.");
      }
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center px-4">
        <div className="bg-white p-12 max-w-md w-full text-center shadow-xl">
          <p className="font-display font-light text-navy text-section-lg mb-3">Account created — pending review.</p>
          <p className="font-sans text-body-md text-ink/60 mb-3">
            Thanks for applying to list with Off The Plan. We&apos;ve received your application and will review it within one business day.
          </p>
          <p className="font-sans text-body-md text-ink/60 mb-8">
            You&apos;ll receive an email once your account is approved, after which you can sign in and start listing.
          </p>
          <Link href="/" className="btn-primary inline-block">Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4 py-20 relative">

      <div className="bg-white w-full max-w-xl shadow-xl px-10 py-10">
        {/* Title */}
        <h1 className="font-display font-semibold text-navy text-2xl text-center mb-6">
          List with us
        </h1>

        {/* Agency / Developer toggle */}
        <div className="flex items-center justify-center gap-4 mb-7">
          <button
            type="button"
            onClick={() => setRole("agency")}
            className={`px-8 py-2 font-mono text-label-lg uppercase tracking-widest border-2 transition-colors ${
              role === "agency"
                ? "bg-orange border-orange text-white"
                : "border-orange/30 text-ink/50 hover:border-orange/60"
            }`}
          >
            Agency
          </button>
          <span className="font-sans text-body-md text-ink/40">Or</span>
          <button
            type="button"
            onClick={() => setRole("developer")}
            className={`px-8 py-2 font-mono text-label-lg uppercase tracking-widest border-2 transition-colors ${
              role === "developer"
                ? "bg-orange border-orange text-white"
                : "border-orange/30 text-ink/50 hover:border-orange/60"
            }`}
          >
            Developer
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              name="first_name"
              type="text"
              placeholder="First Name"
              required
              className="border border-line px-3 py-2.5 font-sans text-body-md outline-none focus:border-orange/60 w-full"
            />
            <input
              name="last_name"
              type="text"
              placeholder="Last Name"
              required
              className="border border-line px-3 py-2.5 font-sans text-body-md outline-none focus:border-orange/60 w-full"
            />
          </div>

          <input
            name="company"
            type="text"
            placeholder="Developer or Agency Name"
            className="border border-line px-3 py-2.5 font-sans text-body-md outline-none focus:border-orange/60 w-full"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              name="phone"
              type="tel"
              placeholder="Phone"
              className="border border-line px-3 py-2.5 font-sans text-body-md outline-none focus:border-orange/60 w-full"
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
              className="border border-line px-3 py-2.5 font-sans text-body-md outline-none focus:border-orange/60 w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              name="password"
              type="password"
              placeholder="New Password"
              required
              minLength={8}
              autoComplete="new-password"
              className="border border-line px-3 py-2.5 font-sans text-body-md outline-none focus:border-orange/60 w-full"
            />
            <input
              name="confirm_password"
              type="password"
              placeholder="Confirm Password"
              required
              minLength={8}
              autoComplete="new-password"
              className="border border-line px-3 py-2.5 font-sans text-body-md outline-none focus:border-orange/60 w-full"
            />
          </div>

          {error && (
            <p className="font-sans text-body-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">
              {error}
            </p>
          )}

          {/* Terms */}
          <div className="flex items-center gap-2 mt-1">
            <input
              id="agree"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 accent-orange cursor-pointer"
            />
            <label htmlFor="agree" className="font-sans text-body-md text-ink/70 cursor-pointer">
              I agree with{" "}
              <a href="/terms-and-conditions.pdf" target="_blank" rel="noopener" className="text-orange hover:underline">
                terms and conditions
              </a>
            </label>
          </div>

          {/* Actions row */}
          <div className="flex items-center justify-between mt-2">
            <a href="/terms-and-conditions.pdf" target="_blank" rel="noopener" className="font-sans text-body-md text-ink/50 hover:text-orange transition-colors">
              Terms and conditions *
            </a>
            <button
              type="submit"
              disabled={!agreed || submitting}
              className="bg-orange text-white font-mono text-label-lg uppercase tracking-widest px-8 py-2.5 hover:bg-orange/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>

          <p className="font-sans text-body-md text-ink/50 text-right mt-1">
            Already have an account?{" "}
            <Link href="/login" className="text-orange hover:underline">
              Log In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
