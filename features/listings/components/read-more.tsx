"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ReadMoreProps {
  text: string;
  /** Number of characters to show when collapsed. Default: 320 */
  limit?: number;
  className?: string;
}

export function ReadMore({ text, limit = 320, className }: ReadMoreProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > limit;

  const displayText = isLong && !expanded ? text.slice(0, limit).trimEnd() + "…" : text;

  return (
    <div className={className}>
      <p className="font-sans text-body-lg text-ink/70 leading-relaxed whitespace-pre-line">
        {displayText}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "mt-3 font-mono text-label-sm uppercase tracking-widest text-orange hover:text-orange/70 transition-colors"
          )}
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      )}
    </div>
  );
}
