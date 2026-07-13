"use client";

import { AccordionSection } from "../fields/accordion-section";
import { SingleUpload } from "../fields/single-upload";
import { inp } from "../constants";
import type { UploadsSlice } from "../use-listing-form-state";

interface Props {
  uploads: UploadsSlice;
  setUploads: (p: Partial<UploadsSlice>) => void;
}

export function OptionalUploadsSection({ uploads, setUploads }: Props) {
  return (
    <AccordionSection title="Optional Uploads">
      {/* Upload floor plans */}
      <SingleUpload
        label="Upload floor plans"
        hint="(File size: up to 10MB)"
        value={uploads.floorPlanUploadUrl}
        onChange={(v) => setUploads({ floorPlanUploadUrl: v })}
        accept="image/jpeg,image/png,image/webp,application/pdf"
      />

      {/* Upload Additional Video — matches legacy layout (2026-07-02). URL
          field (the DB column additional_video_url takes a string), same
          +Add/Save button shape as the 3D Tour Link below. */}
      <div className="border-b border-line pb-5 mb-5">
        <p className="font-sans text-sm font-medium text-ink/80 mb-2">Upload Additional Video</p>
        <div className="flex gap-2">
          <input
            type="url"
            value={uploads.additionalVideoUrl}
            onChange={(e) => setUploads({ additionalVideoUrl: e.target.value })}
            placeholder="https://..."
            className={inp}
          />
          <button
            type="button"
            onClick={() => setUploads({ additionalVideoUrl: "" })}
            className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors whitespace-nowrap"
          >
            + Add
          </button>
          <button
            type="button"
            className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-teal-400 text-teal-600 hover:bg-teal-500 hover:text-white transition-colors whitespace-nowrap"
          >
            Save
          </button>
        </div>
      </div>

      {/* 3D Tour Link */}
      <div className="border-b border-line pb-5 mb-5">
        <p className="font-sans text-sm font-medium text-ink/80 mb-2">3D Tour Link</p>
        <p className="font-sans text-xs text-ink/40 mb-2">
          If using a video that is already online, you can insert the URL here.
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={uploads.virtualTourUrl}
            onChange={(e) => setUploads({ virtualTourUrl: e.target.value })}
            placeholder="https://..."
            className={inp}
          />
          <button
            type="button"
            onClick={() => setUploads({ virtualTourUrl: "" })}
            className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors whitespace-nowrap"
          >
            + Add
          </button>
          <button
            type="button"
            className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-teal-400 text-teal-600 hover:bg-teal-500 hover:text-white transition-colors whitespace-nowrap"
          >
            Save
          </button>
        </div>
      </div>

      {/* Price List */}
      <SingleUpload
        label="Price List"
        hint="(File size: up to 10MB)"
        value={uploads.priceListUrl}
        onChange={(v) => setUploads({ priceListUrl: v })}
        accept="image/jpeg,image/png,image/webp,application/pdf"
      />

      {/* Brochure */}
      <SingleUpload
        label="Brochure"
        hint="(File size: up to 10MB)"
        value={uploads.brochureUrl}
        onChange={(v) => setUploads({ brochureUrl: v })}
        accept="image/jpeg,image/png,image/webp,application/pdf"
      />

      {/* Specifications */}
      <SingleUpload
        label="Specifications"
        hint="(File size: up to 10MB)"
        value={uploads.specificationsUrl}
        onChange={(v) => setUploads({ specificationsUrl: v })}
        accept="image/jpeg,image/png,image/webp,application/pdf"
      />
    </AccordionSection>
  );
}
