"use client";

import { useEffect } from "react";

/**
 * Invisible component — fires once on mount to log a page view.
 * Renders nothing. Place it anywhere inside the listing page.
 */
export function ViewTracker({ developmentId }: { developmentId: string }) {
  useEffect(() => {
    fetch("/api/track/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ developmentId }),
    }).catch(() => {
      // silently ignore — analytics should never break the page
    });
  }, [developmentId]);

  return null;
}
