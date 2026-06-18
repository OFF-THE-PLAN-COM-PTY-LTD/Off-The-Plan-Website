"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Shown at the top of every /portal page when an admin has used the
 * "Sign In As" feature to impersonate a member. Makes it visually
 * obvious that the current view isn't the admin's own account, and
 * gives a one-click recovery path back to the admin login.
 *
 * Trigger: localStorage["otp:impersonation-context"] gets set in
 * app/admin/members/member-row-actions.tsx (and the agencies sign-in-as
 * helper) right before window.open(magicLink). localStorage is shared
 * across tabs of the same origin, so the new portal tab sees the flag
 * immediately when this component mounts.
 *
 * Cleared on click of "Sign back in as admin" — which also signs the
 * impersonated session out and bounces to /login.
 */
export default function ImpersonationBanner() {
  const router = useRouter();
  const [target, setTarget] = useState<{ email: string; name: string | null } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("otp:impersonation-context");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { email?: string; name?: string | null };
      if (parsed?.email) {
        setTarget({ email: parsed.email, name: parsed.name ?? null });
      }
    } catch {
      // Malformed payload — ignore.
    }
  }, []);

  async function handleReturnToAdmin() {
    setBusy(true);
    try {
      const supabase = createClient();
      try {
        localStorage.removeItem("otp:impersonation-context");
      } catch {}
      await supabase.auth.signOut();
      router.push("/login");
    } finally {
      setBusy(false);
    }
  }

  if (!target) return null;

  return (
    <div className="bg-yellow-100 border-b border-yellow-300 px-4 py-2.5">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <p className="font-sans text-sm text-yellow-900">
          <span className="font-semibold">Impersonating</span>{" "}
          <span>{target.name ?? target.email}</span>
          <span className="text-yellow-800/70"> — you&apos;re seeing this member&apos;s portal, not your own.</span>
        </p>
        <button
          type="button"
          onClick={handleReturnToAdmin}
          disabled={busy}
          className="font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border border-yellow-700 text-yellow-900 hover:bg-yellow-200 transition-colors disabled:opacity-40 whitespace-nowrap"
        >
          {busy ? "Signing out…" : "Sign back in as admin"}
        </button>
      </div>
    </div>
  );
}
