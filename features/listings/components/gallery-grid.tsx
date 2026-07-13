"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Lightbox } from "@/components/lightbox";

interface GalleryImage {
  url: string;
  alt: string;
  id?: string;
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
