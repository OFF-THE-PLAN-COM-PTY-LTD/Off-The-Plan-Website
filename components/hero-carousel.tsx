"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon, CameraIcon } from "@/components/icons";

const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&h=900&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&h=900&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&h=900&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&h=900&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&h=900&fit=crop&auto=format&q=80",
];

interface CarouselImage {
  url: string;
  caption?: string | null;
}

interface HeroCarouselProps {
  images: CarouselImage[];
  name: string;
}

function Lightbox({
  images,
  startIndex,
  name,
  onClose,
}: {
  images: CarouselImage[];
  startIndex: number;
  name: string;
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
      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M4 4L16 16M4 16L16 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 font-mono text-[11px] text-white/60 tracking-widest">
        {idx + 1} / {total}
      </div>

      {/* Image */}
      <div
        className="relative w-full h-full max-w-5xl mx-auto px-16"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[idx].url}
          alt={images[idx].caption ?? `${name} image ${idx + 1}`}
          fill
          className="object-contain"
          sizes="100vw"
          priority
        />
      </div>

      {/* Caption */}
      {images[idx].caption && (
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 font-sans text-[13px] text-white/60 text-center px-8">
          {images[idx].caption}
        </p>
      )}

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

export function HeroCarousel({ images, name }: HeroCarouselProps) {
  const displayImages = images.length > 0
    ? images
    : MOCK_IMAGES.map((url) => ({ url, caption: null }));

  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const total = displayImages.length;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, 4000);
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const prev = () => { setCurrent((c) => (c - 1 + total) % total); resetTimer(); };
  const next = () => { setCurrent((c) => (c + 1) % total); resetTimer(); };

  return (
    <>
      <div className="relative w-full h-[65vh] bg-navy overflow-hidden cursor-zoom-in">
        {displayImages.map((img, i) => (
          <div
            key={i}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              i === current ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={() => setLightboxOpen(true)}
          >
            <Image
              src={img.url}
              alt={img.caption ?? `${name} image ${i + 1}`}
              fill
              className="object-cover"
              priority={i === 0}
              sizes="100vw"
            />
          </div>
        ))}

        {/* Subtle bottom gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-transparent pointer-events-none" />

        {total > 1 && (
          <>
            {/* Left arrow */}
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md transition-colors"
            >
              <ChevronLeftIcon size={20} className="text-navy" />
            </button>

            {/* Right arrow */}
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Next image"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md transition-colors"
            >
              <ChevronRightIcon size={20} className="text-navy" />
            </button>

            {/* Photo counter badge */}
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5">
              <CameraIcon size={13} className="text-white" />
              <span className="font-mono text-[11px] text-white tracking-wider">
                {current + 1} / {total}
              </span>
            </div>

            {/* Dot indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
              {displayImages.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                  aria-label={`Go to image ${i + 1}`}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    i === current ? "bg-white w-4" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {lightboxOpen && (
        <Lightbox
          images={displayImages}
          startIndex={current}
          name={name}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
