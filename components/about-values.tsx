"use client";

import { useState } from "react";

const VALUES = [
  {
    label: "Passion",
    description: "We approach every project with energy and commitment.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 30s-13-7.5-13-17a8 8 0 0116 0 8 8 0 0116 0c0 9.5-13 17-13 17z" />
        <circle cx="18" cy="13" r="3" />
      </svg>
    ),
  },
  {
    label: "Innovation",
    description: "We embrace creativity and forward thinking in everything we do.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6a9 9 0 00-4 17.1V26h8v-2.9A9 9 0 0018 6z" />
        <path d="M14 26h8M15 29h6" />
        <circle cx="27" cy="9" r="2.5" />
        <path d="M24.5 9H22M27 6.5V4M29.5 6.5l1.5-1.5M29.5 11.5l1.5 1.5" />
      </svg>
    ),
  },
  {
    label: "Excellence",
    description: "We hold ourselves to the highest standards and deliver with quality.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 4l3.6 7.3 8 1.2-5.8 5.6 1.4 8-7.2-3.8-7.2 3.8 1.4-8L6.4 12.5l8-1.2L18 4z" />
        <circle cx="18" cy="18" r="5" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    label: "Growth",
    description: "We focus on constant improvement in our team, products and community.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 28l8-8 5 5 11-13" />
        <path d="M26 15h5V10" />
        <line x1="6" y1="28" x2="30" y2="28" />
        <line x1="6" y1="8" x2="6" y2="28" />
      </svg>
    ),
  },
  {
    label: "Trust",
    description: "We build relationships on honesty, transparency and accountability.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 18c2-2 4-3 6-2l4 2 4-2c2-1 5 0 6 2" />
        <path d="M8 16c0-2 1-5 4-6l2 3 2-5c3 1 5 4 5 8" />
        <path d="M6 18c0 4 5 9 12 12 7-3 12-8 12-12" />
      </svg>
    ),
  },
  {
    label: "Balance",
    description: "We encourage a respectful, family oriented culture that gives back.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="18" y2="30" />
        <line x1="10" y1="30" x2="26" y2="30" />
        <line x1="8" y1="12" x2="28" y2="12" />
        <path d="M8 12l-4 6h8l-4-6z" />
        <path d="M28 12l-4 6h8l-4-6z" />
      </svg>
    ),
  },
];

export function AboutValues() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="flex flex-col items-center">
      {/* Circles row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-6 md:gap-10 w-full justify-items-center">
        {VALUES.map((v, i) => (
          <div
            key={v.label}
            className="flex flex-col items-center gap-3 cursor-pointer"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                hovered === i
                  ? "bg-navy border-navy text-ink-light"
                  : "border-ink/20 text-ink/50 hover:border-navy/40"
              }`}
            >
              {v.icon}
            </div>
            <p
              className={`font-mono text-label-sm uppercase tracking-widest transition-colors duration-200 ${
                hovered === i ? "text-orange" : "text-ink/60"
              }`}
            >
              {v.label}
            </p>
          </div>
        ))}
      </div>

      {/* Description area */}
      <div className="mt-6 h-8 text-center">
        {hovered !== null && (
          <p className="font-sans text-body-md text-orange transition-opacity duration-200">
            {VALUES[hovered].description}
          </p>
        )}
      </div>
    </div>
  );
}
