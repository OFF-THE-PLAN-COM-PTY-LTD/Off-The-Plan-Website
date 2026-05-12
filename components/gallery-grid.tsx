"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { useCallback, useEffect } from "react";

interface GalleryImage {
  url: string;
  alt: string;
  id?: string;
}

function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: GalleryImage[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const total = images.length;

  const prev = useCallback(() => setIdx((i) => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setIdx((i) => (i + 1) % total), [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M4 4L16 16M4 16L16 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 font-mono text-[11px] text-white/60 tracking-widest">
        {idx + 1} / {total}
      </div>
      <div
        className="relative w-full h-full max-w-5xl mx-auto px-16"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[idx].url}
          alt={images[idx].alt}
          fill
          className="object-contain"
          sizes="100vw"
          priority
        />
      </div>
      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="Previous"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <ChevronLeftIcon size={22} className="text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="Next"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <ChevronRightIcon size={22} className="text-white" />
          </button>
        </>
      )}
    </div>
  );
}

export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {images.map((img, i) => (
          <button
            key={img.id ?? i}
            onClick={() => setLightboxIdx(i)}
            className="relative h-52 overflow-hidden bg-navy/5 cursor-zoom-in group"
            aria-label={`View ${img.alt}`}
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill
              className={cn("object-cover transition-transform duration-500 group-hover:scale-105")}
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          </button>
        ))}
      </div>
      {lightboxIdx !== null && (
        <Lightbox
          images={images}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>
  );
}
