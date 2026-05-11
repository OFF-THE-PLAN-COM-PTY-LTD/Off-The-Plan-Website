"use client";

import { useState } from "react";

interface ListingDescriptionProps {
  html: string;
  /** Approximate pixel height to show when collapsed. Default: 320 */
  collapseAt?: number;
}

/**
 * Renders scraped listing description HTML with a Read More / Read Less toggle.
 * The collapsed state shows the first `collapseAt` px with a fade-out gradient.
 */
export function ListingDescription({ html, collapseAt = 320 }: ListingDescriptionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div className="relative">
        <div
          className="listing-description font-sans text-[14px] text-ink/80 leading-relaxed overflow-hidden"
          style={{ maxHeight: expanded ? "none" : collapseAt }}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Fade gradient when collapsed */}
        {!expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-cream to-transparent pointer-events-none" />
        )}
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 font-mono text-[10px] uppercase tracking-widest text-orange hover:text-orange/70 transition-colors"
      >
        {expanded ? "Read Less ↑" : "Read More ↓"}
      </button>
    </div>
  );
}
