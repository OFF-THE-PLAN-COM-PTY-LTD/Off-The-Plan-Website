"use client";

import { AccordionSection } from "../fields/accordion-section";
import { inp } from "../constants";
import type { SeoSlice } from "../use-listing-form-state";

interface Props {
  seo: SeoSlice;
  setSeo: (p: Partial<SeoSlice>) => void;
}

export function SeoSection({ seo, setSeo }: Props) {
  return (
    <AccordionSection title="SEO">
      <div className="flex flex-col gap-4">
        <div>
          <label className="font-sans text-sm text-ink/70 block mb-1.5">Page Title:</label>
          <input type="text" value={seo.seoTitle} onChange={(e) => setSeo({ seoTitle: e.target.value })} placeholder="e.g. Luxury Apartments in Melbourne CBD | ProjectName" className={inp} />
        </div>
        <div>
          <label className="font-sans text-sm text-ink/70 block mb-1.5">Meta Description:</label>
          <textarea rows={8} value={seo.seoDescription} onChange={(e) => setSeo({ seoDescription: e.target.value })} placeholder="150–160 character description for search engines…" className={inp + " resize-none"} />
        </div>
      </div>
    </AccordionSection>
  );
}
