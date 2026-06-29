"use client";

import { useState } from "react";

/**
 * Self-service "Forgot password?" toggle for the sign-in page. Expands an
 * email field that posts to /api/auth/forgot-password, which emails a
 * branded set-password link. Always shows a generic confirmation so we
 * never reveal whether an account exists.
 */
export default function ForgotPassword() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setStatus("sending");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Swallow — we always show the same generic message.
    }
    setStatus("sent");
  }

  if (!open) {
    return (
      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-sans text-body-md text-ink/50 hover:text-orange hover:underline"
        >
          Forgot Your Password?
        </button>
      </div>
    );
  }

  if (status === "sent") {
    return (
      <div className="mt-4 bg-green-50 border border-green-200 px-3 py-2.5">
        <p className="font-sans text-body-md text-green-800">
          If an account exists for <span className="font-semibold">{email}</span>, we&apos;ve emailed a link to set a new password.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 border-t border-line pt-4">
      <label htmlFor="forgot-email" className="section-label block mb-1.5">Reset your password</label>
      <p className="font-sans text-body-md text-ink/50 mb-2">Enter your email and we&apos;ll send you a link to set a new one.</p>
      <div className="flex gap-2">
        <input
          id="forgot-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="btn-primary whitespace-nowrap disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Send link"}
        </button>
      </div>
    </form>
  );
}
