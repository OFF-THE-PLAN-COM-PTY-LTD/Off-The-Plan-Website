import Link from "next/link";
import type { Metadata } from "next";

// Landing page after Supabase verifies a new signup's email. Per Tim
// (2026-06-30) new Developer/Agent accounts are auto-approved, so the
// applicant can sign in immediately — this page is now purely a friendly
// confirmation before they head to /login. We deliberately don't call
// exchangeCodeForSession here (keeping session establishment to /login).

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
          Your account is ready. Sign in to start uploading your listings — our team reviews each listing before it goes live on the site.
        </p>
        <Link href="/login" className="btn-primary inline-block">Sign in</Link>
      </div>
    </div>
  );
}
