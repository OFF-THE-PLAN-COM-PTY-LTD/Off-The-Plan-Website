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
              className="absolute -top-4 -right-4 z-10 w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-white/80 transition-colors shadow-lg"
              aria-label="Close video"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="3" x2="15" y2="15" />
                <line x1="15" y1="3" x2="3" y2="15" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
