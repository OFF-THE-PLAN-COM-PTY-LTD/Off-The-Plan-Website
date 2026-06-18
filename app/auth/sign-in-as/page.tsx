"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Magic-link callback handler for the admin "Sign In As" impersonation
 * flow. Lives on its own path (not /auth/callback, which is already
 * taken by the OAuth PKCE handler).
 *
 * The default Supabase magic-link flow lands the user on the redirect
 * URL with auth tokens in the URL hash and relies on the browser-side
 * Supabase client to pick them up. When the admin impersonates a
 * member, the home/destination page doesn't pull those tokens fast
 * enough to override the admin's existing session — so the admin
 * silently stays signed in as themselves.
 *
 * This page explicitly:
 *   1. Reads access_token + refresh_token from the URL hash
 *   2. Calls supabase.auth.setSession() (this OVERWRITES the existing
 *      admin session with the target member's tokens)
 *   3. Redirects to the `next` query param (defaults to /portal)
 */

export default function SignInAsPage() {
  return (
    <Suspense fallback={<CallbackShell message="Signing you in…" />}>
      <SignInAsInner />
    </Suspense>
  );
}

function SignInAsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/portal";

  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    const supabase = createClient();

    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    if (!hash) {
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
