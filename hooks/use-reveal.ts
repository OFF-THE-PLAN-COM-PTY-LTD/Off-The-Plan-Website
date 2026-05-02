"use client";

import { useEffect, useRef } from "react";

interface UseRevealOptions {
  threshold?: number;
  rootMargin?: string;
}

/**
 * Attach to a container ref. All children with class `reveal-item`
 * will have `is-in` added when they enter the viewport.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseRevealOptions = {}
) {
  const { threshold = 0.15, rootMargin = "0px 0px -40px 0px" } = options;
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const items = Array.from(container.querySelectorAll<HTMLElement>(".reveal-item"));
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return ref;
}
