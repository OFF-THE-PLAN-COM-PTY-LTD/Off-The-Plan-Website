"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Landing page for the "set / reset your password" link emailed to users.
 *
 * Client launch ask (Tim, 15 Jun): instead of us issuing passwords, new
 * users set their own the first time they sign in. We email each user a
 * Supabase recovery link (see lib/auth/send-set-password.ts) that lands
 * here.
 *
 * A recovery link drops the user here with the session tokens in the URL
 * hash (#access_token=…&refresh_token=…&type=recovery) — the same shape the
 * /auth/sign-in-as impersonation page consumes. We establish that session,
 * then let them choose a password via supabase.auth.updateUser({ password }).
 *
 * Fallback: if Supabase is on the PKCE flow it arrives as ?code= instead,
 * so we also handle exchangeCodeForSession.
 */

type Phase = "verifying" | "ready" | "invalid" | "saving" | "done";

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<Shell><Spinner /><p className="font-sans text-ink/70 text-sm mt-4">Loading…</p></Shell>}>
      <SetPasswordInner />
    </Suspense>
  );
}

function SetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phase, setPhase] = useState<Phase>("verifying");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Establish the recovery session from the link the user clicked.
  useEffect(() => {
    const supabase = createClient();

    async function establishSession() {
      const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        // Clear the tokens out of the URL bar once consumed.
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", window.location.pathname);
        }
        setPhase(error ? "invalid" : "ready");
        return;
      }

      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        setPhase(error ? "invalid" : "ready");
        return;
      }

      // No tokens — maybe they're already signed in (e.g. came from a "change
      // password" link in their account). Allow it if a session exists.
      const { data } = await supabase.auth.getUser();
      setPhase(data.user ? "ready" : "invalid");
    }

    establishSession().catch(() => setPhase("invalid"));
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setPhase("saving");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message || "Could not update password. Your link may have expired.");
      setPhase("ready");
      return;
    }
    setPhase("done");
    setTimeout(() => {
      window.location.replace("/account");
    }, 1600);
  }

  if (phase === "verifying") {
    return <Shell><Spinner /><p className="font-sans text-ink/70 text-sm mt-4">Verifying your link…</p></Shell>;
  }

  if (phase === "invalid") {
    return (
      <Shell>
        <h1 className="font-display font-light text-navy text-section-lg mb-2">Link expired</h1>
        <p className="font-sans text-body-md text-ink/60 mb-6">
          This password link is invalid or has already been used. Request a new one from the sign-in page.
        </p>
        <a href="/login" className="btn-primary inline-block">Back to sign in</a>
      </Shell>
    );
  }

  if (phase === "done") {
    return (
      <Shell>
        <div className="inline-block w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center mb-4 text-lg">✓</div>
        <h1 className="font-display font-light text-navy text-section-lg mb-2">Password set</h1>
        <p className="font-sans text-body-md text-ink/60">Taking you to your account…</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="font-display font-light text-navy text-section-lg mb-2">Set your password</h1>
      <p className="font-sans text-body-md text-ink/60 mb-8">Choose a password for your Off The Plan account.</p>

      {error && (
        <p className="mb-4 font-sans text-body-md text-red-600 bg-red-50 border border-red-200 px-3 py-2.5">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="password" className="section-label block mb-1.5">New password</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="section-label block mb-1.5">Confirm password</label>
          <input
            id="confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60"
          />
        </div>
        <p className="font-sans text-[11px] text-ink/40">Minimum 8 characters.</p>
        <button type="submit" disabled={phase === "saving"} className="btn-primary w-full mt-2 disabled:opacity-50">
          {phase === "saving" ? "Saving…" : "Set password"}
        </button>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-sm text-center sm:text-left">{children}</div>
    </div>
  );
}

function Spinner() {
  return <div className="inline-block w-8 h-8 border-2 border-orange border-t-transparent rounded-full animate-spin" />;
}
