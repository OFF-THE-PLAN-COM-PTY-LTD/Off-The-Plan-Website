import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-cream pt-16">
      <section className="bg-navy py-16">
        <div className="container-padded">
          <h1 className="font-display font-light text-ink-light text-section-xl">Get in touch</h1>
        </div>
      </section>

      <div className="container-padded py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 max-w-4xl">
          {/* Left column: contact details */}
          <div className="flex flex-col gap-8">
            <p className="font-sans text-body-md text-ink-dark/70 leading-relaxed">
              Australia's home of off-the-plan property. Reach us for listing enquiries, editorial
              partnerships, or general questions.
            </p>

            <div className="flex flex-col gap-6">
              <div>
                <p className="font-mono text-label-sm uppercase tracking-widest text-ink-dark/40 mb-1.5">
                  Phone
                </p>
                <a
                  href="tel:0410313030"
                  className="font-mono text-body-md text-ink-dark hover:text-orange transition-colors"
                >
                  0410 313 030
                </a>
              </div>

              <div>
                <p className="font-mono text-label-sm uppercase tracking-widest text-ink-dark/40 mb-1.5">
                  Email
                </p>
                <a
                  href="mailto:info@offtheplan.com.au"
                  className="font-mono text-body-md text-ink-dark hover:text-orange transition-colors"
                >
                  info@offtheplan.com.au
                </a>
              </div>

              <div>
                <p className="font-mono text-label-sm uppercase tracking-widest text-ink-dark/40 mb-1.5">
                  Address
                </p>
                <address className="font-mono text-body-md text-ink-dark not-italic leading-relaxed">
                  Commercial Suite 5<br />
                  8 Adelaide Terrace<br />
                  East Perth WA 6004
                </address>
              </div>
            </div>
          </div>

          {/* Right column: contact form */}
          <form className="flex flex-col gap-4">
            <div>
              <label className="section-label block mb-1.5">Name</label>
              <input
                type="text"
                className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60"
              />
            </div>
            <div>
              <label className="section-label block mb-1.5">Email</label>
              <input
                type="email"
                className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60"
              />
            </div>
            <div>
              <label className="section-label block mb-1.5">Message</label>
              <textarea
                rows={5}
                className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60 resize-none"
              />
            </div>
            <button type="submit" className="btn-primary self-start">
              Send message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
