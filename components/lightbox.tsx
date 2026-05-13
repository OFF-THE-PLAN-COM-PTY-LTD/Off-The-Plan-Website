"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

export interface LightboxImage {
  url: string;
  alt?: string | null;
  caption?: string | null;
}

interface LightboxProps {
  images: LightboxImage[];
  startIndex: number;
  onClose: () => void;
}

export function Lightbox({ images, startIndex, onClose }: LightboxProps) {
  const [idx, setIdx] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const total = images.length;

  const prev = useCallback(() => { setIdx((i) => (i - 1 + total) % total); setZoom(1); }, [total]);
  const next = useCallback(() => { setIdx((i) => (i + 1) % total); setZoom(1); }, [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (zoom > 1) setZoom(1); else onClose(); }
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next, zoom]);

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    if (zoom > 1) {
      setZoom(1);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x, y });
    setZoom(2.5);
  }

  const img = images[idx];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={() => { if (zoom > 1) setZoom(1); else onClose(); }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M4 4L16 16M4 16L16 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 font-mono text-[11px] text-white/60 tracking-widest pointer-events-none">
        {idx + 1} / {total}
      </div>

      {/* Zoom hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 font-mono text-[10px] text-white/30 tracking-widest pointer-events-none">
        {zoom > 1 ? "Click to zoom out" : "Click image to zoom in"}
      </div>

      {/* Image */}
      <div
        className="relative w-full h-full max-w-5xl mx-auto px-16 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="absolute inset-0 mx-16"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: `${origin.x}% ${origin.y}%`,
            transition: "transform 0.3s ease",
            cursor: zoom > 1 ? "zoom-out" : "zoom-in",
          }}
          onClick={handleImageClick}
        >
          <Image
            src={img.url}
            alt={img.alt ?? img.caption ?? `Image ${idx + 1}`}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>
      </div>

      {/* Caption */}
      {img.caption && zoom === 1 && (
        <p className="absolute bottom-10 left-1/2 -translate-x-1/2 font-sans text-[13px] text-white/60 text-center px-8 pointer-events-none">
          {img.caption}
        </p>
      )}

      {total > 1 && zoom === 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="Previous"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <ChevronLeftIcon size={22} className="text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="Next"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <ChevronRightIcon size={22} className="text-white" />
          </button>
        </>
      )}
    </div>
  );
}
