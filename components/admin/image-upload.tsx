"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  bucket?: "development-images" | "journal-images";
}

export function ImageUpload({
  label,
  value,
  onChange,
  bucket = "development-images",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);

    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Upload failed. Please try again.");
      setUploading(false);
      return;
    }

    onChange(json.url);
    setUploading(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div>
      <p className="section-label block mb-1.5">{label}</p>

      {/* Preview */}
      {value && (
        <div className="relative mb-3 w-full h-48 bg-navy/5 border border-line overflow-hidden">
          <Image
            src={value}
            alt="Preview"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 bg-white/90 hover:bg-white text-ink px-2 py-1 font-mono text-label-sm uppercase tracking-widest transition-colors"
          >
            Remove
          </button>
        </div>
      )}

      {/* Drop zone */}
      {!value && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-2 w-full h-36 border-2 border-dashed cursor-pointer transition-colors ${
            dragOver ? "border-orange bg-orange/5" : "border-line hover:border-orange/50"
          }`}
        >
          {uploading ? (
            <>
              <div className="w-6 h-6 border-2 border-navy/20 border-t-orange rounded-full animate-spin" />
              <p className="font-mono text-label-sm text-ink/40 uppercase tracking-widest">Uploading…</p>
            </>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-ink/30">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="font-mono text-label-sm text-ink/40 uppercase tracking-widest">
                Drop image or click to upload
              </p>
              <p className="font-mono text-label-sm text-ink/25 uppercase tracking-widest">
                JPG, PNG, WebP · Max 10 MB
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="sr-only"
        tabIndex={-1}
      />

      {/* Manual URL fallback */}
      <div className="mt-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste an image URL directly"
          className="w-full border border-line px-3 py-2 bg-white font-sans text-body-md text-ink outline-none focus:border-orange/60 transition-colors text-sm"
        />
      </div>

      {error && (
        <p className="mt-1.5 font-mono text-label-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
