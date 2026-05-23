import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream pt-16">
      <section className="bg-navy py-16">
        <div className="container-padded">
          <h1 className="font-display font-light text-ink-light text-section-xl">Privacy Policy</h1>
        </div>
      </section>

      <div className="container-padded py-14 max-w-3xl">
        <p className="font-mono text-label-sm uppercase tracking-widest text-ink-dark/40 mb-6">
          Last updated: 24 May 2026
        </p>

        <div className="prose font-sans text-body-md text-ink-dark/80 leading-relaxed flex flex-col gap-6">
          <p>
            Off The Plan Com Pty Ltd (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to
            protecting your personal information in accordance with the{" "}
            <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles (APPs). This
            policy explains what we collect, why we collect it, and your rights.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">1. Information we collect</h2>
          <p>
            We collect information you provide directly &mdash; including your name, email address,
            phone number, postcode, and any messages you submit through our forms (enquiries,
            contact, list-a-listing, and the Inner Circle signup). For account holders we also
            store profile details, your selected role (Buyer, Agent, Developer or similar), and any
            images you upload to listings or your profile.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">2. Automatically collected information</h2>
          <p>
            When you view a listing we record aggregate usage events (views, shares, phone clicks)
            associated with that listing. These events are not linked to your identity. We do not
            currently use cookies for tracking beyond what is required to keep you signed in.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">3. How we use your information</h2>
          <p>
            We use submitted information to respond to your enquiry, manage your account, send you
            transactional emails (such as confirmation of an enquiry), and share enquiry details
            with the relevant developer, agent or agency for the listing you contacted. Aggregate
            analytics help us improve the platform.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">4. Disclosure of information</h2>
          <p>
            We do not sell your personal information. We disclose enquiry details to the listing
            owner (developer, agent or agency) so they can follow up with you about that listing.
            We also use third-party service providers to operate the platform, including Supabase
            (data storage and authentication, hosted in Australia / Sydney region) and Vercel
            (web hosting). These providers process data on our behalf under contractual
            confidentiality obligations.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">5. Overseas disclosure</h2>
          <p>
            Some service providers we use may store or process data on servers outside Australia.
            Where this occurs, we take reasonable steps to ensure overseas recipients handle your
            personal information consistently with the Australian Privacy Principles.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">6. Your rights</h2>
          <p>
            You can request access to, correction of, or deletion of your personal information by
            emailing us at the address below. You also have the right to complain to the Office of
            the Australian Information Commissioner (OAIC) if you believe we have not handled your
            information in accordance with the Privacy Act.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">7. Data security</h2>
          <p>
            We take reasonable steps to protect your personal information from misuse, interference,
            loss, unauthorised access, modification and disclosure. No method of internet
            transmission or electronic storage is completely secure, so we cannot guarantee
            absolute security. In the event of a data breach that is likely to result in serious
            harm, we will notify you and the OAIC as required under the Notifiable Data Breaches
            scheme.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">8. Retention</h2>
          <p>
            We keep personal information only for as long as needed to fulfil the purposes set out
            in this policy or to comply with legal obligations. When information is no longer
            required, we take reasonable steps to delete or de-identify it.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">9. Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date at
            the top of the page reflects the most recent revision. Continued use of the site after a
            change means you accept the updated policy.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">10. Contact</h2>
          <p>
            Privacy questions, access requests or complaints can be sent to{" "}
            <a href="mailto:info@offtheplan.com.au" className="text-orange hover:underline">
              info@offtheplan.com.au
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
