"use client";

import { AccordionSection } from "../fields/accordion-section";
import { SingleUpload } from "../fields/single-upload";
import { GalleryManager } from "../managers/gallery-manager";
import { inp } from "../constants";
import type { GalleryImage } from "../types";
import type { UploadsSlice } from "../use-listing-form-state";

interface Props {
  isNew: boolean;
  uploads: UploadsSlice;
  setUploads: (p: Partial<UploadsSlice>) => void;
  gallery: GalleryImage[];
  addGalleryImage: (url: string) => Promise<void>;
  removeGalleryImage: (imageId: string) => Promise<void>;
  reorderGallery: (reordered: GalleryImage[]) => void;
}

export function UploadsSection({
  isNew,
  uploads,
  setUploads,
  gallery,
  addGalleryImage,
  removeGalleryImage,
  reorderGallery,
}: Props) {
  return (
    <AccordionSection title="Uploads">
      {/* Main Photo */}
      <SingleUpload
        label="Main Photo Upload *"
        hint="(File size: up to 10MB, Dimensions: 1920×1080)"
        value={uploads.heroImageUrl}
        onChange={(v) => setUploads({ heroImageUrl: v })}
        altText={uploads.heroAltText}
        onAltTextChange={(v) => setUploads({ heroAltText: v })}
      />

      {/* Homepage Feature Image */}
      <SingleUpload
        label="Homepage Feature Image"
        hint="(File size: up to 5MB, Dimensions: 500×500) (This is applicable to premier listings only)"
        value={uploads.featureImageUrl}
        onChange={(v) => setUploads({ featureImageUrl: v })}
      />

      {/* Gallery */}
      {isNew ? (
        <div className="border-b border-line pb-5 mb-5">
          <p className="font-sans text-sm font-medium text-ink/80 mb-1">Gallery Images</p>
          <p className="font-sans text-sm text-ink/40 italic">Save the listing first to add gallery images.</p>
        </div>
      ) : (
        <GalleryManager gallery={gallery} onAdd={addGalleryImage} onRemove={removeGalleryImage} onReorder={reorderGallery} />
      )}

      {/* Video Link */}
      <div className="mb-5">
        <label className="font-sans text-sm text-ink/70 block mb-2">Video Link:</label>
        <input type="url" value={uploads.videoUrl} onChange={(e) => setUploads({ videoUrl: e.target.value })} placeholder="https://youtube.com/..." className={inp} />
      </div>

    </AccordionSection>
  );
}
