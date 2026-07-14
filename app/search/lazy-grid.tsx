"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Progressively reveals a large grid of items instead of mounting them all at
 * once. The server still fetches every result and passes the pre-built card
 * nodes in, but only the first `initialCount` are rendered into the DOM; the
 * rest mount in `step`-sized batches as the user scrolls near the bottom.
 *
 * Why: the /search grid can hold ~88 listing cards, each a client component
 * with its own state and modals. Hydrating all of them made the page heavy —
 * clicking a card to open its preview felt sluggish compared to the light
 * landing page. Rendering ~24 at a time keeps the page responsive while still
 * showing everything as you scroll. The result count above the grid is
 * unaffected (it reflects the full result set).
 */
export function LazyGrid({
  items,
  className,
  initialCount = 24,
  step = 24,
}: {
  items: React.ReactNode[];
  className?: string;
  initialCount?: number;
  step?: number;
}) {
  const [visible, setVisible] = useState(() => Math.min(initialCount, items.length));
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (visible >= items.length) return;
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          // Reveal the next batch a screen early so cards are in place before
          // the user reaches them (no visible pop-in on a normal scroll).
          setVisible((v) => Math.min(v + step, items.length));
        }
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [visible, items.length, step]);

  return (
    <>
      <div className={className}>{items.slice(0, visible)}</div>
      {visible < items.length && (
        <div ref={sentinelRef} aria-hidden="true" className="h-1 w-full" />
      )}
    </>
  );
}
