"use client";

import { useState } from "react";
import { ShareModal } from "@/components/share-modal";

interface ShareButtonProps {
  slug: string;
  name: string;
  suburb?: string | null;
  state?: string | null;
  developmentId?: string;
}

export function ShareButton({ slug, name, suburb, state, developmentId }: ShareButtonProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    if (developmentId) {
      fetch("/api/track/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ developmentId }),
      }).catch(() => {});
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center justify-center gap-2 py-3 w-full font-mono text-[10px] uppercase tracking-widest text-ink/60 hover:text-orange border-r border-line transition-colors"
      >
        <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="15" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="5" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="15" cy="16" r="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 9l6-3.5M7 11l6 3.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        Share
      </button>

      {open && (
        <ShareModal
          slug={slug}
          name={name}
          suburb={suburb}
          state={state}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
