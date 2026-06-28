"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const CARDS = [
  {
    label: "In The Market",
    desc: "If you're ready to explore your next home or investment, head over to our property search.",
    cta: "Search",
    href: "/search",
    modal: false,
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop&auto=format&q=80",
  },
  {
    label: "Developers",
    desc: "For developers looking to showcase a new development, register your project with us.",
    cta: "List Today",
    href: "/list-a-listing",
    modal: false,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop&auto=format&q=80",
  },
  {
    label: "General Enquiries",
    desc: "For general enquiries, please call +61 410 313 030 or complete the contact form and our team will respond promptly.",
    cta: "Contact Us",
    href: null,
    modal: true,
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&h=400&fit=crop&auto=format&q=80",
  },
];

export function ContactNextSteps() {
  const [modalOpen, setModalOpen] = useState(false);
  const [sent, setSent] = useState(false);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setModalOpen(false);
    }, 2000);
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CARDS.map((card) => (
          <div key={card.label} className="h-full flex flex-col border border-line bg-white">
            {/* Text area — flex-1 so it expands to match the tallest card in
                the row, which keeps the images aligned at the same Y position
                across all 3 cards (Tim PDF I21: developers tile alignment). */}
            <div className="flex-1 flex flex-col items-center text-center px-8 pt-10 pb-8">
              <p className="font-mono text-label-sm uppercase tracking-widest text-navy font-semibold mb-5">
                {card.label}
              </p>
              <p className="font-sans text-body-md text-ink/70 leading-relaxed mb-8">{card.desc}</p>
              {card.modal ? (
                <button
                  onClick={() => setModalOpen(true)}
                  className="font-mono text-label-sm uppercase tracking-widest px-6 py-2 border border-ink/30 text-ink hover:border-navy hover:text-navy transition-colors"
                >
                  {card.cta}
                </button>
              ) : (
                <Link
                  href={card.href!}
                  className="font-mono text-label-sm uppercase tracking-widest px-6 py-2 border border-ink/30 text-ink hover:border-navy hover:text-navy transition-colors"
                >
                  {card.cta}
                </Link>
              )}
            </div>
            {/* Image */}
            <div className="relative h-52 overflow-hidden flex-shrink-0">
              <Image src={card.image} alt={card.label} fill className="object-cover" />
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md border-2 border-orange p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-semibold text-navy text-xl">Contact Us</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-ink/40 hover:text-ink transition-colors text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {sent ? (
              <p className="font-sans text-body-md text-orange text-center py-8">
                Message sent! We'll be in touch shortly.
              </p>
            ) : (
              <form onSubmit={handleSend} className="flex flex-col gap-4">
                <div>
                  <label className="font-sans text-body-md text-orange mb-1 block">
                    Name <span className="text-orange">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-line px-3 py-2.5 font-sans text-body-md outline-none focus:border-orange/60"
                  />
                </div>

                <div>
                  <label className="font-sans text-body-md text-orange mb-1 block">
                    Phone No <span className="text-orange">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full border border-line px-3 py-2.5 font-sans text-body-md outline-none focus:border-orange/60"
                  />
                </div>

                <div>
                  <label className="font-sans text-body-md text-orange mb-1 block">
                    Email <span className="text-orange">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full border border-line px-3 py-2.5 font-sans text-body-md outline-none focus:border-orange/60"
                  />
                </div>

                <div>
                  <label className="font-sans text-body-md text-orange mb-1 block">
                    Which type of property are you marketing?
                  </label>
                  <select className="w-full border border-line px-3 py-2.5 font-sans text-body-md outline-none cursor-pointer text-ink/50">
                    <option value="">Category</option>
                    {["New Apartments", "Townhouses", "Land and Estates", "Commercial", "House & Land", "Over 55's / Retirement"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-sans text-body-md text-orange mb-1 block">
                    Where is your property located?
                  </label>
                  <select className="w-full border border-line px-3 py-2.5 font-sans text-body-md outline-none cursor-pointer text-ink/50">
                    <option value="">State</option>
                    {["Australian Capital Territory", "New South Wales", "Northern Territory", "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    className="font-mono text-label-sm uppercase tracking-widest px-8 py-2 border-2 border-orange text-orange hover:bg-orange hover:text-white transition-colors"
                  >
                    Send
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
