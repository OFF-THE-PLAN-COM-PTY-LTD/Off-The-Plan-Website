import Link from "next/link";

const footerColumns = [
  {
    label: "Discover",
    links: [
      { label: "Search developments", href: "/search" },
      { label: "Map view", href: "/map" },
      { label: "Trending", href: "/search?sort=trending" },
      { label: "New launches", href: "/search?tag=new-launch" },
      { label: "Featured", href: "/search?tag=featured" },
    ],
  },
  {
    label: "Residences",
    links: [
      { label: "Apartments", href: "/search?type=apartments" },
      { label: "Townhouses", href: "/search?type=townhouses" },
      { label: "Houses", href: "/search?type=houses" },
      { label: "Penthouses", href: "/search?type=penthouses" },
      { label: "House & Land", href: "/search?type=house-and-land" },
      { label: "Land Estates", href: "/search?type=land-estates" },
    ],
  },
  {
    label: "Industry",
    links: [
      { label: "Developers", href: "/developers" },
      { label: "List a development", href: "/list-a-development" },
      { label: "Resources", href: "/resources" },
    ],
  },
  {
    label: "About",
    links: [
      { label: "Journal", href: "/journal" },
      { label: "Contact", href: "/contact" },
      { label: "Member circle", href: "/#circle" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-navy text-ink-light">
      <div className="max-w-screen-xl mx-auto px-6 md:px-10 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-6">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="font-display text-xl font-light text-ink-light">Off The Plan</span>
            </Link>
            <p className="font-sans text-body-md text-ink-light/60 leading-relaxed max-w-xs">
              Australia's curated marketplace for off-the-plan residential real estate.
              24,000+ members.
            </p>

            <div className="flex flex-col gap-4 mt-5">
              <div>
                <p className="font-mono text-label-sm uppercase tracking-widest text-ink-light/30 mb-0.5">
                  Phone
                </p>
                <a
                  href="tel:0410313030"
                  className="font-mono text-label-sm text-ink-light/50 hover:text-ink-light/80 transition-colors"
                >
                  0410 313 030
                </a>
              </div>

              <div>
                <p className="font-mono text-label-sm uppercase tracking-widest text-ink-light/30 mb-0.5">
                  Email
                </p>
                <a
                  href="mailto:info@offtheplan.com.au"
                  className="font-mono text-label-sm text-ink-light/50 hover:text-ink-light/80 transition-colors"
                >
                  info@offtheplan.com.au
                </a>
              </div>

              <div>
                <p className="font-mono text-label-sm uppercase tracking-widest text-ink-light/30 mb-0.5">
                  Address
                </p>
                <span className="font-mono text-label-sm text-ink-light/50">
                  East Perth WA 6004
                </span>
              </div>
            </div>
          </div>

          {/* Nav columns */}
          {footerColumns.map((col) => (
            <div key={col.label}>
              <p className="font-mono text-label-lg uppercase tracking-widest text-ink-light/40 mb-5">
                {col.label}
              </p>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-sans text-body-md text-ink-light/70 hover:text-ink-light transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright bar */}
        <div className="mt-16 pt-6 border-t border-line-dark flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="font-mono text-label-sm text-ink-light/30 uppercase tracking-widest">
            © {new Date().getFullYear()} Off The Plan. All rights reserved.
          </p>
          <div className="flex gap-6">
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Anti-Money Laundering", href: "/aml" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-label-sm text-ink-light/30 uppercase tracking-widest hover:text-ink-light/60 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
