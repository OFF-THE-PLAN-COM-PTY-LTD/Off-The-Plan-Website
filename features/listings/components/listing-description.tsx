"use client";

import { useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize-html";

interface ListingDescriptionProps {
  html: string;
  /** Approximate pixel height to show when collapsed. Default: 320 */
  collapseAt?: number;
}

/**
 * If the string has no HTML block tags, treat it as plain text and wrap
 * each double-newline-separated paragraph in <p> tags.
 */
function prepareHtml(raw: string): string {
  const html = /<(p|div|br|ul|ol|h[1-6])\b/i.test(raw)
    ? raw
    : raw
        .split(/\n{2,}/)
        .map((block) => `<p>${block.replace(/\n/g, "<br>")}</p>`)
        .filter((p) => p !== "<p></p>")
        .join("");
  // The listing description is member-writable rich text rendered to the
  // public via dangerouslySetInnerHTML — sanitize to prevent stored XSS.
  return sanitizeHtml(html);
}

/**
 * Renders scraped listing description HTML with a Read More / Read Less toggle.
 * The collapsed state shows the first `collapseAt` px with a fade-out gradient.
 */
export function ListingDescription({ html, collapseAt = 320 }: ListingDescriptionProps) {
  const prepared = prepareHtml(html);
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div className="relative">
        <div
          className="listing-description font-sans text-[14px] text-ink/80 leading-relaxed overflow-hidden"
          style={{ maxHeight: expanded ? "none" : collapseAt }}
          dangerouslySetInnerHTML={{ __html: prepared }}
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
