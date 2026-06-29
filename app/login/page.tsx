import type { Metadata } from "next";
import Link from "next/link";
import ForgotPassword from "./forgot-password";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: { searchParams: { redirect?: string; error?: string } }) {
  // Login route uses ?error=pending / ?error=rejected to surface member_status
  // gates, alongside the default ?error=invalid (wrong credentials).
  const errorMessage = (() => {
    switch (searchParams.error) {
      case "pending":
        return "Your account is awaiting admin approval. We'll email you once approved.";
      case "rejected":
        return "Account access has been declined. Please contact us if you believe this is in error.";
      case "invalid":
      default:
        return "Incorrect email or password.";
    }
  })();

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display font-light text-navy text-section-lg mb-2">Sign in</h1>
        <p className="font-sans text-body-md text-ink/60 mb-8">Welcome back to Off The Plan.</p>

        {searchParams.error && (
          <p className="mb-4 font-sans text-body-md text-red-600 bg-red-50 border border-red-200 px-3 py-2.5">
            {errorMessage}
          </p>
        )}

        <form action="/api/auth/login" method="POST" className="flex flex-col gap-3">
          {searchParams.redirect && (
            <input type="hidden" name="redirect" value={searchParams.redirect} />
          )}
          <div>
            <label htmlFor="email" className="section-label block mb-1.5">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60" />
          </div>
          <div>
            <label htmlFor="password" className="section-label block mb-1.5">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60" />
          </div>
          <button type="submit" className="btn-primary w-full mt-2">Sign in</button>
        </form>

        <ForgotPassword />

        <p className="font-sans text-body-md text-ink/50 mt-6 text-center">
          Don&apos;t have an account?{" "}
          <Link href="/list-a-listing" className="text-orange hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
