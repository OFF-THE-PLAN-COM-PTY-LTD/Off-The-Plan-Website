import Link from "next/link";
import type { Metadata } from "next";

// Landing page after Supabase verifies a new signup's email. We don't call
// exchangeCodeForSession here on purpose — new Developer/Agent accounts are
// in member_status='pending', and creating a session would let them bypass
// the pending-gate on the login route. So we just show a clear confirmation
// message; they sign in normally once admin approves them.

export const metadata: Metadata = {
  title: "Email confirmed | Off The Plan",
  robots: { index: false },
};

export default function EmailConfirmedPage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 pt-16">
      <div className="bg-white border border-line p-10 max-w-md w-full text-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-orange mx-auto mb-5" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="9 12 11 14 15 10"/>
        </svg>
        <h1 className="font-display font-light text-navy text-section-lg mb-3">
          Email confirmed.
        </h1>
        <p className="font-sans text-body-md text-ink/65 mb-2">
          Thanks for confirming your email address.
        </p>
        <p className="font-sans text-body-md text-ink/65 mb-8">
          Your account is now in our review queue — we&apos;ll email you within one business day once it&apos;s approved, and you&apos;ll be able to sign in and start listing.
        </p>
        <Link href="/" className="btn-primary inline-block">Back to home</Link>
      </div>
    </div>
  );
}
