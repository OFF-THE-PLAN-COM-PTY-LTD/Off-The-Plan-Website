import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage({ searchParams }: { searchParams: { error?: string; message?: string } }) {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display font-light text-navy text-section-lg mb-2">Create account</h1>
        <p className="font-sans text-body-md text-ink/60 mb-8">Join the Off The Plan member community.</p>

        {searchParams.error && (
          <p className="mb-4 font-sans text-body-md text-red-600 bg-red-50 border border-red-200 px-3 py-2.5">
            {searchParams.message ?? "Something went wrong. Please try again."}
          </p>
        )}

        <form action="/api/auth/signup" method="POST" className="flex flex-col gap-3">
          <div>
            <label htmlFor="full_name" className="section-label block mb-1.5">Full name</label>
            <input id="full_name" name="full_name" type="text" required autoComplete="name" className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60" />
          </div>
          <div>
            <label htmlFor="email" className="section-label block mb-1.5">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60" />
          </div>
          <div>
            <label htmlFor="password" className="section-label block mb-1.5">Password</label>
            <input id="password" name="password" type="password" required autoComplete="new-password" minLength={8} className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60" />
          </div>
          <div>
            <label htmlFor="interest_type" className="section-label block mb-1.5">I&apos;m looking to...</label>
            <select id="interest_type" name="interest_type" className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none cursor-pointer">
              <option value="">Select</option>
              <option value="Owner-occupier">Buy as an Owner-occupier</option>
              <option value="Investor">Buy as an Investor</option>
            </select>
          </div>
          <button type="submit" className="btn-primary w-full mt-2">Create account</button>
        </form>

        {/* Developer / Agent self-signup is intentionally not offered here — it's
            gated by admin approval. We point those users to the proper apply-
            to-list form, which submits a lead Tim reviews. */}
        <div className="mt-6 pt-5 border-t border-line text-center">
          <p className="font-sans text-body-md text-ink/60 mb-2">
            Listing a project?
          </p>
          <Link href="/list-a-listing" className="font-mono text-label-sm uppercase tracking-widest text-orange hover:underline">
            List with us as a developer or agent →
          </Link>
        </div>

        <p className="font-sans text-body-md text-ink/50 mt-6 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-orange hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
