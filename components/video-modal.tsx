"use client";

import { useState } from "react";

interface VideoModalProps {
  videoUrl: string;
  thumbnailUrl: string | null;
  title: string;
}

function getYouTubeEmbedUrl(url: string): string | null {
  // Handles: youtube.com/watch?v=ID  and  youtu.be/ID
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_\-]{11})/);
  if (!match) return null;
  return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`;
}

export function VideoModal({ videoUrl, thumbnailUrl, title }: VideoModalProps) {
  const [open, setOpen] = useState(false);
  const embedUrl = getYouTubeEmbedUrl(videoUrl);
  if (!embedUrl) return null;

  return (
    <>
      {/* Watch button — replaces the static thumbnail block */}
      <button
        onClick={() => setOpen(true)}
        className="relative block w-full h-[76px] overflow-hidden group focus:outline-none"
        aria-label={`Watch video for ${title}`}
      >
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-navy/60" />
        )}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex flex-col items-center justify-end">
          <div className="flex items-center gap-1 bg-black/50 w-full justify-center py-1.5">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-white" aria-hidden="true">
              <path d="M5 4l12 6-12 6V4z" />
            </svg>
            <span className="font-mono text-white text-[9px] uppercase tracking-widest">Watch</span>
          </div>
        </div>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 md:p-8"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-[80vw] aspect-video bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={embedUrl}
              title={title}
              allow="autoplay; fullscreen"
              allowFullScreen
              className="w-full h-full border-0"
            />
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-9 right-0 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-white/70 hover:text-white transition-colors"
              aria-label="Close video"
            >
              Close <span className="text-[14px] leading-none">×</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
