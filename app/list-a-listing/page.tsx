"use client";

import { useState } from "react";
import Link from "next/link";

export default function ListWithUsPage() {
  const [role, setRole] = useState<"agency" | "developer">("agency");
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!agreed) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    data.set("role", role);
    await fetch("/api/leads", { method: "POST", body: data });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center px-4">
        <div className="bg-white p-12 max-w-md w-full text-center shadow-xl">
          <p className="font-display font-light text-navy text-section-lg mb-3">Thanks — we'll be in touch.</p>
          <p className="font-sans text-body-md text-ink/60 mb-8">
            We've received your enquiry and will reach out within one business day.
          </p>
          <Link href="/" className="btn-primary inline-block">Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4 py-20 relative">
      {/* Logo — left side */}
      <div className="hidden lg:flex absolute left-16 top-1/2 -translate-y-1/2 flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Off The Plan"
          className="h-24 w-auto object-contain brightness-0 invert"
        />
      </div>

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
              className="border border-line px-3 py-2.5 font-sans text-body-md outline-none focus:border-orange/60 w-full"
            />
            <input
              name="confirm_password"
              type="password"
              placeholder="Confirm Password"
              className="border border-line px-3 py-2.5 font-sans text-body-md outline-none focus:border-orange/60 w-full"
            />
          </div>

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
              <Link href="/terms" className="text-orange hover:underline">
                terms and conditions
              </Link>
            </label>
          </div>

          {/* Actions row */}
          <div className="flex items-center justify-between mt-2">
            <Link href="/terms" className="font-sans text-body-md text-ink/50 hover:text-orange transition-colors">
              Terms and conditions *
            </Link>
            <button
              type="submit"
              disabled={!agreed}
              className="bg-orange text-white font-mono text-label-lg uppercase tracking-widest px-8 py-2.5 hover:bg-orange/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Register
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
