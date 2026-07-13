"use client";

import { AccordionSection } from "../fields/accordion-section";
import { TagInput } from "../fields/tag-input";
import type { AmenitiesSlice } from "../use-listing-form-state";

interface Props {
  amenities: AmenitiesSlice;
  setAmenities: (p: Partial<AmenitiesSlice>) => void;
}

export function AmenitiesSection({ amenities, setAmenities }: Props) {
  return (
    <AccordionSection title="Nearby Amenities">
      <p className="font-sans text-xs text-ink/40 mb-3">
        Add schools, transport, shopping centres, parks — anything nearby.
      </p>
      <TagInput value={amenities.nearbyAmenities} onChange={(v) => setAmenities({ nearbyAmenities: v })} placeholder="e.g. Melbourne Central Station" />
    </AccordionSection>
  );
}
