"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

const DURATION = 32;

const LOGOS = [
  { name: "TRISECA" },
  { name: "THE ONE\nCOLLECTION" },
  { name: "Laver." },
  { name: "CEDAR\nWOODS" },
  { name: "ETON\nPROPERTY" },
  { name: "FAR EAST\nCONSORTIUM" },
  { name: "FLAGSHIP" },
  { name: "CO-LAB\nRESIDENTIAL" },
  { name: "PRD\nREAL ESTATE" },
  { name: "CHANINE\nDEVELOPMENTS" },
  { name: "CORONATION" },
  { name: "INCA" },
  { name: "PEZET.\nMATHESON." },
  { name: "MASSCON" },
];

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

export function LogoSlider() {
  const trackRef   = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(false);

  const onEnter = () => {
    hoveredRef.current = true;
    if (trackRef.current) trackRef.current.style.animationPlayState = "paused";
  };

  const onLeave = () => {
    hoveredRef.current = false;
    if (trackRef.current) trackRef.current.style.animationPlayState = "running";
  };

  const skip = (dir: "prev" | "next") => {
    const track = trackRef.current;
    if (!track) return;

    const currentX = new DOMMatrix(getComputedStyle(track).transform).m41;
    track.style.animation = "none";
    track.style.transform = `translateX(${currentX}px)`;
    void track.offsetWidth;

    const step = 176; // tile width 160 + gap 16
    const targetX = currentX + (dir === "next" ? -step : step);
    track.style.transition = "transform 0.55s cubic-bezier(0.16,1,0.3,1)";
    track.style.transform  = `translateX(${targetX}px)`;

    setTimeout(() => {
      const half = track.scrollWidth / 2;
      let pos = targetX % -half;
      if (pos > 0) pos -= half;
      if (pos <= -half) pos += half;
      const delay = -((Math.abs(pos) / half) * DURATION);
      track.style.transition = "none";
      track.style.transform  = "";
      track.style.animation  = `slider-scroll ${DURATION}s ${delay}s linear infinite`;
      track.style.animationPlayState = hoveredRef.current ? "paused" : "running";
    }, 580);
  };

  const strip = [...LOGOS, ...LOGOS];

  return (
    <div>
      {/* Header */}
      <div className="container-padded flex items-center justify-between mb-8">
        <p className="font-mono uppercase tracking-widest text-navy font-semibold" style={{ fontSize: "15px" }}>
          Trusted By:
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => skip("prev")}
            aria-label="Previous"
            className={cn(
              "w-10 h-10 rounded-full border border-ink/25 flex items-center justify-center",
              "text-ink/60 hover:bg-orange hover:border-orange hover:text-white transition-all duration-300"
            )}
          >
            <ArrowLeft />
          </button>
          <button
            onClick={() => skip("next")}
            aria-label="Next"
            className={cn(
              "w-10 h-10 rounded-full border border-ink/25 flex items-center justify-center",
              "text-ink/60 hover:bg-orange hover:border-orange hover:text-white transition-all duration-300"
            )}
          >
            <ArrowRight />
          </button>
        </div>
      </div>

      {/* Strip */}
      <div
        className="w-full overflow-hidden"
        style={{
          maskImage: "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)",
        }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        <div
          ref={trackRef}
          className="flex gap-4 w-max"
          style={{ animation: `slider-scroll ${DURATION}s linear infinite` }}
        >
          {strip.map((logo, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-40 h-20 border border-ink/10 bg-white flex items-center justify-center px-4 hover:border-ink/30 transition-colors"
            >
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink/60 text-center whitespace-pre-line leading-snug">
                {logo.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
