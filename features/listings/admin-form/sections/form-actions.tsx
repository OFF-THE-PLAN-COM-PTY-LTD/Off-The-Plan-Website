"use client";

import Link from "next/link";
import { categorySlug } from "@/lib/listing-url";
import type { ListingData } from "../types";

// Filled-color scheme (2026-06-30): Back = ink/black, Save = green,
// Preview = orange, Delete = red. Same font/tracking as the rest of
// the admin UI so it doesn't feel out of place. Back honours isPortal
// so portal users don't get bounced by middleware to /admin/listings.
//
// Autosave indicator (2026-07-02) sits next to the Save button so
// users can see their changes are being persisted every few seconds.

interface Props {
  isNew: boolean;
  isPortal: boolean;
  saving: boolean;
  deleting: boolean;
  autoSaveStatus: "idle" | "saving" | "saved" | "error";
  type: string;
  existing?: ListingData;
  setShowDeleteModal: (v: boolean) => void;
  setDeleteConfirmText: (v: string) => void;
}

export function FormActions({
  isNew,
  isPortal,
  saving,
  deleting,
  autoSaveStatus,
  type,
  existing,
  setShowDeleteModal,
  setDeleteConfirmText,
}: Props) {
  return (
    <div className="flex items-center justify-between pt-4">
      <div className="flex items-center gap-3">
        <Link
          href={isPortal ? "/portal/listings" : "/admin/listings"}
          className="font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 bg-ink text-white hover:bg-ink/80 transition-colors inline-flex items-center gap-1.5"
        >
          ← Back
        </Link>
        <button type="submit" disabled={saving || deleting} className="font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 bg-green-700 text-white hover:bg-green-800 transition-colors disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
        {!isNew && autoSaveStatus !== "idle" && (
          <span
            className={`font-mono text-[10px] uppercase tracking-widest ${
              autoSaveStatus === "saving" ? "text-ink/50"
              : autoSaveStatus === "saved" ? "text-green-700"
              : "text-red-600"
            }`}
          >
            {autoSaveStatus === "saving" ? "Autosaving…"
              : autoSaveStatus === "saved" ? "✓ Saved"
              : "Autosave failed"}
          </span>
        )}
        {!isNew && existing?.slug && (
          <Link
            href={`/${categorySlug(type)}/${existing.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 bg-orange text-white hover:bg-orange/85 transition-colors"
          >
            Preview
          </Link>
        )}
      </div>
      {!isNew && (
        <button
          type="button"
          onClick={() => { setDeleteConfirmText(""); setShowDeleteModal(true); }}
          disabled={deleting || saving}
          className="font-mono text-label-sm uppercase tracking-widest px-4 py-2 bg-red-700 text-white hover:bg-red-800 transition-colors disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete listing"}
        </button>
      )}
    </div>
  );
}
