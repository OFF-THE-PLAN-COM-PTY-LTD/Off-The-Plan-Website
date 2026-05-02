import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "List a Development",
  description: "Get your off-the-plan development in front of 24,000+ qualified buyers.",
};

interface Props {
  searchParams: { submitted?: string; error?: string };
}

export default function ListADevelopmentPage({ searchParams }: Props) {
  const submitted = searchParams.submitted === "1";
  const hasError = searchParams.error === "1";

  return (
    <div className="min-h-screen bg-cream pt-16">
      <section className="bg-navy py-16">
        <div className="container-padded max-w-2xl">
          <p className="section-label text-ink-light/30 mb-3">For developers &amp; agents</p>
          <h1 className="font-display font-light text-ink-light text-section-xl mb-4">List your development</h1>
          <p className="font-sans text-body-lg text-ink-light/60">
            Reach 24,000+ qualified buyers before your development hits the general market.
          </p>
        </div>
      </section>

      <div className="container-padded py-14 max-w-2xl">
        {submitted ? (
          <div className="border border-line bg-white p-10 text-center">
            <p className="font-display font-light text-navy text-section-lg mb-3">Thanks — we'll be in touch.</p>
            <p className="font-sans text-body-md text-ink/60 mb-8">
              We've received your enquiry and will reach out within one business day.
            </p>
            <Link href="/" className="btn-primary inline-block">Back to home</Link>
          </div>
        ) : (
          <>
            {hasError && (
              <p className="mb-6 font-sans text-body-md text-red-600 bg-red-50 border border-red-200 px-4 py-3">
                Something went wrong. Please try again.
              </p>
            )}
            <form action="/api/leads" method="POST" className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact_name" className="section-label block mb-1.5">Contact name *</label>
              <input id="contact_name" name="contact_name" type="text" required className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60" />
            </div>
            <div>
              <label htmlFor="email" className="section-label block mb-1.5">Email *</label>
              <input id="email" name="email" type="email" required className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="company" className="section-label block mb-1.5">Company</label>
              <input id="company" name="company" type="text" className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60" />
            </div>
            <div>
              <label htmlFor="phone" className="section-label block mb-1.5">Phone</label>
              <input id="phone" name="phone" type="tel" className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60" />
            </div>
          </div>
          <div>
            <label htmlFor="development_name" className="section-label block mb-1.5">Development name *</label>
            <input id="development_name" name="development_name" type="text" required className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="suburb" className="section-label block mb-1.5">Suburb</label>
              <input id="suburb" name="suburb" type="text" className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60" />
            </div>
            <div>
              <label htmlFor="state" className="section-label block mb-1.5">State</label>
              <select id="state" name="state" className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none cursor-pointer">
                <option value="">Select state</option>
                {["VIC", "NSW", "QLD", "WA", "SA"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="residence_count" className="section-label block mb-1.5">Number of residences</label>
              <input id="residence_count" name="residence_count" type="number" min="1" className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60" />
            </div>
            <div>
              <label htmlFor="expected_completion" className="section-label block mb-1.5">Expected completion</label>
              <input id="expected_completion" name="expected_completion" type="text" placeholder="e.g. Q4 2027" className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60" />
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="section-label block mb-1.5">Additional notes</label>
            <textarea id="notes" name="notes" rows={4} className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60 resize-none" />
          </div>
          <button type="submit" className="btn-primary self-start">Submit enquiry</button>
        </form>
          </>
        )}
      </div>
    </div>
  );
}
