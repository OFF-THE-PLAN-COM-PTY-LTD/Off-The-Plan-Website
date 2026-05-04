"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface Category {
  label: string;
  href: string;
  image: string;
}

function ChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CategoryCarousel({ categories }: { categories: Category[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "prev" | "next") => {
    const track = trackRef.current;
    if (!track) return;
    const item = track.firstElementChild as HTMLElement | null;
    const gap = 16; // gap-4
    const step = item ? item.offsetWidth + gap : 300;
    track.scrollBy({ left: dir === "next" ? step : -step, behavior: "smooth" });
  };

  return (
    <div>
      {/* Header row with arrow buttons */}
      <div className="flex items-center justify-between mb-8">
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40">
          Search by Category
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("prev")}
            aria-label="Previous"
            className={cn(
              "w-10 h-10 border border-ink/20 flex items-center justify-center",
              "text-ink/40 hover:border-ink/70 hover:text-ink",
              "transition-all duration-300",
            )}
          >
            <ChevronLeft />
          </button>
          <button
            onClick={() => scroll("next")}
            aria-label="Next"
            className={cn(
              "w-10 h-10 border border-ink/20 flex items-center justify-center",
              "text-ink/40 hover:border-ink/70 hover:text-ink",
              "transition-all duration-300",
            )}
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* Carousel — overflow wrapper clips the scrollbar */}
      <div className="overflow-hidden">
        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((cat) => (
            <div
              key={cat.label}
              className="flex-shrink-0 snap-start w-full sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)]"
            >
              <Link href={cat.href} className="group relative block h-72 overflow-hidden">
                <Image
                  src={cat.image}
                  alt={cat.label}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/30 to-navy/10 group-hover:from-navy/60 group-hover:via-navy/15 transition-all duration-500" />

                {/* Label + decorative line */}
                <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-white drop-shadow">
                    {cat.label}
                  </span>
                  <span
                    className="block h-px bg-white/50 transition-all duration-500 w-6 group-hover:w-12"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
