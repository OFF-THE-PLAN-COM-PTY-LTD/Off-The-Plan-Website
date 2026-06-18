"use client";

import { useState } from "react";

/**
 * Reuses the impersonation endpoint built for the All Agencies page
 * (POST /api/admin/users/impersonate) — generates a one-time magic
 * link and opens the member's portal in a new tab so admin can see
 * exactly what they see.
 *
 * Two UX safety nets on top of the raw button:
 *   - Confirmation dialog warns the admin that opening the link will
 *     replace their admin session in the browser (cookies are shared
 *     across tabs of the same origin, so once the new tab signs in
 *     as the target user, the admin tab is also signed in as them).
 *   - "Admin session swapped" recovery dialog appears if the API
 *     returns 403 — which happens when an earlier impersonation
 *     swapped the cookies and the user is no longer admin.
 *
 * Disabled when the profile has no email on file (e.g. legacy rows
 * inserted without auth.users linkage).
 */
export function MemberRowActions({
  email,
  name,
}: {
  email: string | null;
  name?: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSwappedRecovery, setShowSwappedRecovery] = useState(false);

  async function proceedSignInAs() {
    setShowConfirm(false);
    if (!email) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        if (res.status === 403) {
          // Admin's session has been swapped to a non-admin (earlier impersonation).
          setShowSwappedRecovery(true);
        } else {
          alert(json.error ?? "Could not generate sign-in link.");
        }
        return;
      }
      // Tag the next tab so the portal layout can show an "Impersonating X"
      // banner. localStorage is shared across same-origin tabs.
      try {
        localStorage.setItem(
          "otp:impersonation-context",
          JSON.stringify({
            email,
            name: name ?? null,
            startedAt: new Date().toISOString(),
          }),
        );
      } catch {
        // Storage may be unavailable in private mode; banner just won't show.
      }
      window.open(json.url, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (email) setShowConfirm(true);
        }}
        disabled={!email || busy}
        title={email ? "Open this member's portal in a new tab" : "No email on file"}
        className="font-mono text-[10px] uppercase tracking-widest px-2 py-1.5 border border-navy text-navy hover:bg-navy hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {busy ? "…" : "Sign In As"}
      </button>

      {/* Pre-flight confirmation — tell the admin what's about to happen. */}
      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => !busy && setShowConfirm(false)}
        >
          <div
            className="bg-white max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-sans font-semibold text-base text-ink mb-2">
              Sign in as {name ?? email}?
            </h2>
            <p className="font-sans text-sm text-ink/70 mb-3">
              This opens the member&apos;s portal in a new tab. Because browser
              cookies are shared across tabs, your admin session in <em>this</em>{" "}
              tab will also switch to that member.
            </p>
            <p className="font-sans text-sm text-ink/60 mb-5">
              <strong>To return to admin:</strong> close the new tab and use the
              &quot;Sign back in as admin&quot; banner that appears in the
              portal, or sign out and sign in again with your admin email.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={busy}
                className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-ink/20 text-ink/60 hover:bg-cream/40 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={proceedSignInAs}
                disabled={busy}
                className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 bg-navy text-white hover:bg-navy/80 transition-colors disabled:opacity-40"
              >
                {busy ? "Opening…" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recovery dialog — shown when the admin's session was swapped earlier. */}
      {showSwappedRecovery && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSwappedRecovery(false)}
        >
          <div
            className="bg-white max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-sans font-semibold text-base text-ink mb-2">
              Your admin session was swapped
            </h2>
            <p className="font-sans text-sm text-ink/70 mb-5">
              You&apos;re currently signed in as a member, not as an admin —
              probably from a previous &quot;Sign In As&quot; in another tab.
              Sign back in as admin to impersonate someone else.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSwappedRecovery(false)}
                className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-ink/20 text-ink/60 hover:bg-cream/40 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem("otp:impersonation-context");
                  } catch {}
                  window.location.href = "/login";
                }}
                className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 bg-navy text-white hover:bg-navy/80 transition-colors"
              >
                Sign back in as admin
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
