"use client";

import { useState, useRef } from "react";

export function SingleUpload({
  label,
  hint,
  value,
  onChange,
  altText,
  onAltTextChange,
  accept = "image/jpeg,image/png,image/webp",
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  altText?: string;
  onAltTextChange?: (v: string) => void;
  accept?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isImageOnly = !accept.includes("pdf");

  async function upload(file: File) {
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "development-images");
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const json = await res.json();
    if (res.ok) onChange(json.url);
    else setUploadError(json.error ?? "Upload failed");
    setUploading(false);
  }

  const filename = value ? value.split("/").pop() : null;

  return (
    <div className="border-b border-line pb-5 mb-5 last:border-0 last:mb-0 last:pb-0">
      {filename && (
        <div className="flex items-center gap-2 mb-1">
          <a href={value} target="_blank" rel="noopener noreferrer" className="font-sans text-sm text-orange hover:underline truncate max-w-xs">
            {filename}
          </a>
          <button type="button" onClick={() => onChange("")} className="text-red-400 hover:text-red-600 flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      )}
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <p className="font-sans text-sm font-medium text-ink/80 mb-2">
            {label}
          </p>
          <div className="flex items-center gap-3 mb-1.5">
            <input ref={inputRef} type="file" accept={accept} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} className="sr-only" />
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors disabled:opacity-50 whitespace-nowrap">
              {uploading ? "Uploading…" : value ? "Select Another File" : "Select File"}
            </button>
            {!value && <span className="font-sans text-sm text-ink/40">No file chosen</span>}
          </div>
          {uploadError && <p className="font-sans text-xs text-red-500 mb-1">{uploadError}</p>}
          {hint && <p className="font-sans text-xs text-ink/40">{hint}</p>}
          {isImageOnly && <p className="font-sans text-xs text-ink/40 mt-1">Or upload photo from your computer.</p>}
          {isImageOnly && value && (
            <div className="mt-2">
              <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Or paste an image URL" className="w-full border border-line px-2 py-1.5 bg-white font-sans text-xs text-ink/60 outline-none focus:border-orange/60" />
            </div>
          )}
        </div>
        {onAltTextChange !== undefined && (
          <div className="w-72 flex-shrink-0">
            <p className="font-sans text-sm text-ink/70 mb-2">Main Photo Alt Text:</p>
            <input type="text" value={altText ?? ""} onChange={(e) => onAltTextChange(e.target.value)} className="w-full border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 transition-colors" />
          </div>
        )}
      </div>
    </div>
  );
}
