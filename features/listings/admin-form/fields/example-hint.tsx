"use client";

import { useState } from "react";

/**
 * Click-to-open hint that explains where a given input surfaces on the public
 * listing card. Used next to fields the client flagged as confusing during
 * the June 1-7 testing round.
 */
export function ExampleHint({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="font-sans text-xs text-orange underline underline-offset-2 hover:text-orange/80 ml-2"
      >
        (View Example)
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute left-0 top-full mt-2 z-50 w-[520px] max-w-[90vw] bg-white border-2 border-orange shadow-xl rounded-sm p-4 text-left">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h4 className="font-sans font-semibold text-sm text-ink">{title}</h4>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-ink/40 hover:text-ink text-xl leading-none -mt-1"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="font-sans text-sm text-ink/70 space-y-3">{children}</div>
          </div>
        </>
      )}
    </span>
  );
}
