"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Magic-link callback handler.
 *
 * Used by the admin "Sign In As" flow (and any future magic-link
 * sign-ins where we need to overwrite an existing session). The
 * default Supabase behaviour is to land on the redirect URL with the
 * auth tokens in the URL hash and rely on the browser-side Supabase
 * client to pick them up — but the home page doesn't pull them in
 * fast enough to cleanly swap an existing session, so the admin who
 * impersonated would silently stay signed in as themselves.
 *
 * This page explicitly:
 *   1. Reads access_token + refresh_token from the URL hash
 *   2. Calls supabase.auth.setSession() (this OVERWRITES any existing
 *      session belonging to the previous user)
 *   3. Redirects to the `next` query param (defaults to /portal)
 */

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackShell message="Signing you in…" />}>
      <CallbackInner />
    </Suspense>
  );
}

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/portal";

  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    const supabase = createClient();

    // Hash from a Supabase magic-link redirect: #access_token=...&refresh_token=...&type=magiclink&...
    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    if (!hash) {
      // Nothing to swap — just bounce to the destination.
      window.location.replace(next);
      return;
    }
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) {
      setMessage("Sign-in link is invalid or expired. Redirecting…");
      setTimeout(() => router.push("/login"), 1500);
      return;
    }

    supabase.auth
      .setSession({ access_token, refresh_token })
      .then(({ error }) => {
        if (error) {
          console.error("setSession failed:", error);
          setMessage("Sign-in failed. Redirecting…");
          setTimeout(() => router.push("/login"), 1500);
          return;
        }
        // Strip the hash before navigating so it doesn't linger on the
        // destination URL.
        window.location.replace(next);
      })
      .catch((err) => {
        console.error("setSession threw:", err);
        setMessage("Sign-in failed. Redirecting…");
        setTimeout(() => router.push("/login"), 1500);
      });
  }, [router, next]);

  return <CallbackShell message={message} />;
}

function CallbackShell({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-2 border-orange border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-sans text-ink/70 text-sm">{message}</p>
      </div>
    </div>
  );
}
