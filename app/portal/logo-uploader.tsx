"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";

interface Props {
  field: "company_logo_url" | "developer_logo_url";
  label: string;
  currentUrl: string | null;
}

export function LogoUploader({ field, label, currentUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const form = new FormData();
    form.append("file", file);
    form.append("field", field);

    const res = await fetch("/api/portal/upload", { method: "POST", body: form });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Upload failed");
    } else {
      setPreview(json.url);
    }
    setUploading(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink/50">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative w-32 h-20 border-2 border-dashed border-line hover:border-orange/50 transition-colors flex items-center justify-center bg-cream/40 overflow-hidden group"
      >
        {preview ? (
          <>
            <img src={preview} alt={label} className="w-full h-full object-contain p-2" />
            <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload size={14} className="text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-ink/30 group-hover:text-orange/60 transition-colors">
            <Upload size={16} />
            <span className="font-mono text-[9px] uppercase tracking-widest">Upload</span>
          </div>
        )}
      </button>
      {uploading && (
        <p className="font-mono text-[9px] uppercase tracking-widest text-ink/40">Uploading…</p>
      )}
      {error && (
        <p className="font-mono text-[9px] uppercase tracking-widest text-red-500">{error}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
