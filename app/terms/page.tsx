import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms and Conditions" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cream pt-16">
      <section className="bg-navy py-16">
        <div className="container-padded">
          <h1 className="font-display font-light text-ink-light text-section-xl">
            Terms and Conditions
          </h1>
        </div>
      </section>

      <div className="container-padded py-14 max-w-3xl">
        <p className="font-mono text-label-sm uppercase tracking-widest text-ink-dark/40 mb-6">
          Last updated: 24 May 2026
        </p>

        <div className="prose font-sans text-body-md text-ink-dark/80 leading-relaxed flex flex-col gap-6">
          <p>
            These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of
            offtheplan.com.au (the &quot;site&quot;), operated by Off The Plan Com Pty Ltd
            (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). By accessing or using the site you
            agree to be bound by these Terms.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">1. About the platform</h2>
          <p>
            The site is a directory and discovery platform for off-the-plan property developments in
            Australia. We are not a real estate agent or party to any sale. Listings are provided by
            developers, agents and agencies (&quot;listing owners&quot;), and any transaction
            relating to a property is between you and the listing owner.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">2. Use of the site</h2>
          <p>
            You agree to use the site only for lawful purposes and in a way that does not infringe
            the rights of, restrict or inhibit the use of the site by, any other person. You must
            not attempt to gain unauthorised access to any portion of the site, the systems on which
            it runs, or any other user&apos;s account.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">3. Listings and content accuracy</h2>
          <p>
            Property information including pricing, configurations, completion dates, images and
            descriptions is supplied by listing owners. While we take reasonable care, we do not
            warrant the accuracy, completeness or currency of any listing. You should make your own
            enquiries, obtain independent legal and financial advice, and inspect documentation
            before entering into any contract for the purchase of an off-the-plan property.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">4. Accounts</h2>
          <p>
            You may create an account to save listings, submit enquiries or list a development. You
            are responsible for maintaining the confidentiality of your login credentials and for
            all activity that occurs under your account. Notify us immediately at the contact
            address below if you suspect any unauthorised use. We may suspend or terminate accounts
            that breach these Terms or that are used for misleading, deceptive or unlawful conduct.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">5. Listing owner obligations</h2>
          <p>
            Listing owners warrant that they have the right to publish the content they upload, that
            the content is accurate at the time of publication, and that it complies with all
            applicable laws (including Australian Consumer Law and state real estate legislation).
            We may remove any listing at our discretion, including where we receive a complaint
            about its accuracy or legality.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">6. Intellectual property</h2>
          <p>
            The site, including its layout, design, text and graphics, is protected by copyright and
            other intellectual property rights. You may not reproduce, distribute or republish any
            part of the site without our prior written consent, other than for your own personal,
            non-commercial use. Listing owners retain copyright in the content they upload but grant
            us a non-exclusive licence to display and promote that content on the site.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">7. Third-party links</h2>
          <p>
            The site may contain links to third-party websites, including developer and agency
            sites. We are not responsible for the content, availability or practices of those sites,
            and links do not imply endorsement.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">8. Liability</h2>
          <p>
            To the maximum extent permitted by law, we exclude all warranties, representations and
            conditions not expressly set out in these Terms. We are not liable for any indirect,
            special or consequential loss arising out of or in connection with your use of the site
            or reliance on any listing. Nothing in these Terms limits any rights you may have under
            the Australian Consumer Law that cannot lawfully be excluded.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">9. Privacy</h2>
          <p>
            Our handling of personal information is described in our{" "}
            <a href="/privacy" className="text-orange hover:underline">Privacy Policy</a>, which
            forms part of these Terms.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">10. Changes</h2>
          <p>
            We may update these Terms from time to time. The &quot;Last updated&quot; date at the
            top of the page reflects the most recent revision. Continued use of the site after a
            change takes effect constitutes acceptance of the updated Terms.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">11. Governing law</h2>
          <p>
            These Terms are governed by the laws of Victoria, Australia. You submit to the
            non-exclusive jurisdiction of the courts of that State and the Commonwealth of
            Australia.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">12. Contact</h2>
          <p>
            Questions about these Terms can be sent to{" "}
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
