"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import type { GalleryImage } from "../types";

export function GalleryManager({
  gallery,
  onAdd,
  onRemove,
  onReorder,
}: {
  gallery: GalleryImage[];
  onAdd: (url: string) => void;
  onRemove: (id: string) => void;
  onReorder: (reordered: GalleryImage[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  async function uploadSingle(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "development-images");
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    if (!res.ok) return null;
    const json = await res.json();
    return typeof json.url === "string" ? json.url : null;
  }

  /**
   * Accepts a batch of files. Trims to remaining capacity (20-image cap),
   * uploads them sequentially so we don't overwhelm the API, and reports
   * progress for each one.
   */
  async function uploadImages(files: File[]) {
    setUploadError(null);
    const remainingCapacity = Math.max(0, 20 - gallery.length);
    if (remainingCapacity === 0) {
      setUploadError("Maximum 20 images reached.");
      return;
    }
    const toUpload = files.slice(0, remainingCapacity);
    const skipped = files.length - toUpload.length;

    setUploading(true);
    setUploadProgress({ done: 0, total: toUpload.length });

    let failed = 0;
    for (let i = 0; i < toUpload.length; i++) {
      const url = await uploadSingle(toUpload[i]);
      if (url) onAdd(url);
      else failed += 1;
      setUploadProgress({ done: i + 1, total: toUpload.length });
    }

    setUploading(false);
    setUploadProgress(null);
    if (failed > 0 || skipped > 0) {
      const parts: string[] = [];
      if (failed > 0) parts.push(`${failed} upload${failed === 1 ? "" : "s"} failed`);
      if (skipped > 0) parts.push(`${skipped} skipped (20-image cap)`);
      setUploadError(parts.join(" · "));
    }
  }

  function handleDragStart(i: number) {
    dragIndex.current = i;
  }

  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    setDragOverIndex(i);
  }

  async function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null || from === dropIndex) {
      setDragOverIndex(null);
      return;
    }
    const reordered = [...gallery];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(dropIndex, 0, moved);
    const withOrder = reordered.map((img, idx) => ({ ...img, sort_order: idx }));
    onReorder(withOrder);
    dragIndex.current = null;
    setDragOverIndex(null);
    await fetch("/api/admin/gallery", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates: withOrder.map(({ id, sort_order }) => ({ id, sort_order })) }),
    });
  }

  function handleDragEnd() {
    dragIndex.current = null;
    setDragOverIndex(null);
  }

  return (
    <div className="border-b border-line pb-5 mb-5">
      <div className="flex items-start gap-8">
        {/* Left: upload controls */}
        <div className="flex-shrink-0 w-72">
          <p className="font-sans text-sm font-medium text-ink/80 mb-2">
            Select up to 20 images ({gallery.length}/20)
          </p>
          <div className="flex items-center gap-3 mb-1.5">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length > 0) uploadImages(files);
                e.target.value = "";
              }}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading || gallery.length >= 20}
              className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {uploading
                ? uploadProgress
                  ? `Uploading ${uploadProgress.done}/${uploadProgress.total}…`
                  : "Uploading…"
                : "Select Files"}
            </button>
            {!uploading && <span className="font-sans text-sm text-ink/40">Choose one or more</span>}
          </div>
          <p className="font-sans text-xs text-ink/40">Hold Shift or Ctrl/Cmd in the file picker to select multiple at once.</p>
          <p className="font-sans text-xs text-ink/40">(File size: up to 10MB each, Dimensions: 1920×1080)</p>
          {uploadError && (
            <p className="font-sans text-xs text-orange mt-1">{uploadError}</p>
          )}
          {gallery.length >= 20 && !uploadError && (
            <p className="font-sans text-xs text-orange mt-1">Maximum 20 images reached.</p>
          )}
        </div>

        {/* Right: draggable numbered list */}
        {gallery.length > 0 && (
          <div className="flex-1">
            <p className="font-sans text-sm text-orange mb-3">
              Click and drag images to change their order
            </p>
            <div className="flex flex-col gap-1">
              {gallery.map((img, i) => {
                const filename = img.url.split("/").pop() ?? img.url;
                const isDragOver = dragOverIndex === i;
                return (
                  <div
                    key={img.id}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDrop={(e) => handleDrop(e, i)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 px-2 py-1.5 rounded cursor-grab active:cursor-grabbing transition-colors select-none ${
                      isDragOver ? "bg-orange/10 border border-orange/40" : "hover:bg-cream/60 border border-transparent"
                    }`}
                  >
                    <span className="font-sans text-sm text-ink/40 w-5 flex-shrink-0 text-right">{i + 1}.</span>
                    {/* Drag handle */}
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-ink/30 flex-shrink-0">
                      <circle cx="4" cy="2" r="1.2"/><circle cx="8" cy="2" r="1.2"/>
                      <circle cx="4" cy="6" r="1.2"/><circle cx="8" cy="6" r="1.2"/>
                      <circle cx="4" cy="10" r="1.2"/><circle cx="8" cy="10" r="1.2"/>
                    </svg>
                    <div className="relative w-10 h-10 overflow-hidden bg-navy/5 flex-shrink-0">
                      <Image src={img.url} alt="" fill className="object-cover" sizes="40px" />
                    </div>
                    <a
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-sans text-sm text-orange hover:underline truncate flex-1 max-w-xs"
                    >
                      {filename}
                    </a>
                    <button
                      type="button"
                      onClick={() => onRemove(img.id)}
                      className="text-red-400 hover:text-red-600 flex-shrink-0"
                      title="Remove image"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
