"use client";

import Link from "next/link";

export interface SliderItem {
  label: string;
  href: string;
  image: string;
}

interface ImageAutoSliderProps {
  items: SliderItem[];
  /** Full-loop duration in seconds. Lower = faster. Default 32s */
  speed?: number;
  /** Height of each image tile. Default h-72 */
  tileHeight?: string;
}

export function ImageAutoSlider({
  items,
  speed = 32,
  tileHeight = "h-72",
}: ImageAutoSliderProps) {
  // Duplicate so the strip loops seamlessly
  const strip = [...items, ...items];

  return (
    <div
      className="w-full overflow-hidden group/slider"
      style={{
        maskImage:
          "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}
    >
      <div
        className="flex gap-4 w-max group-hover/slider:[animation-play-state:paused]"
        style={{ animation: `slider-scroll ${speed}s linear infinite` }}
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
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent group-hover/tile:from-navy/55 transition-all duration-500" />
            {/* Label + decorative line */}
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
  );
}
