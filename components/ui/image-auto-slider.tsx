"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface SliderItem {
  label: string;
  href: string;
  image: string;
}

function ArrowLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ImageAutoSlider({
  items,
  tileHeight = "h-72",
}: {
  items: SliderItem[];
  tileHeight?: string;
}) {
  const trackRef  = useRef<HTMLDivElement>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);

  // ─── Auto-scroll: 1.5 px every 16 ms ≈ 90 px / s ───────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const track = trackRef.current;
      if (!track || pausedRef.current) return;

      track.scrollLeft += 1.5;

      // Seamless loop — when we pass the first copy, jump back by one copy width
      if (track.scrollLeft >= track.scrollWidth / 2) {
        track.scrollLeft -= track.scrollWidth / 2;
      }
    }, 16);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ─── Manual prev / next ──────────────────────────────────────────────────
  const scrollManual = (dir: "prev" | "next") => {
    const track = trackRef.current;
    if (!track) return;
    pausedRef.current = true;
    track.scrollBy({ left: dir === "next" ? 272 : -272, behavior: "smooth" });
    // Resume auto-scroll once the smooth scroll settles
    setTimeout(() => { pausedRef.current = false; }, 800);
  };

  const strip = [...items, ...items];

  return (
    <div>
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-6 md:px-10 flex items-center justify-between mb-8">
        <p className="font-mono text-[13px] uppercase tracking-widest text-ink">
          Search by Category
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => scrollManual("prev")}
            aria-label="Previous"
            className={cn(
              "w-12 h-12 rounded-full border border-ink/25 flex items-center justify-center",
              "text-ink/60 hover:bg-orange hover:border-orange hover:text-white",
              "transition-all duration-300 ease-out",
            )}
          >
            <ArrowLeft />
          </button>
          <button
            onClick={() => scrollManual("next")}
            aria-label="Next"
            className={cn(
              "w-12 h-12 rounded-full border border-ink/25 flex items-center justify-center",
              "text-ink/60 hover:bg-orange hover:border-orange hover:text-white",
              "transition-all duration-300 ease-out",
            )}
          >
            <ArrowRight />
          </button>
        </div>
      </div>

      {/* ─── Scrolling strip ────────────────────────────────────────────── */}
      {/* onMouseEnter / Leave here so hovering any tile pauses the strip   */}
      <div
        className="w-full overflow-hidden"
        style={{
          maskImage: "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)",
        }}
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
      >
        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-scroll"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {strip.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className={`group/tile relative flex-shrink-0 w-64 ${tileHeight} overflow-hidden`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.label}
                className="w-full h-full object-cover transition-transform duration-700 group-hover/tile:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent group-hover/tile:from-navy/55 transition-all duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                <span className="font-mono text-[11px] uppercase tracking-widest text-white drop-shadow">
                  {item.label}
                </span>
                <span
                  className="block h-px bg-white/50 w-5 transition-all duration-500 group-hover/tile:w-10"
                  aria-hidden="true"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
