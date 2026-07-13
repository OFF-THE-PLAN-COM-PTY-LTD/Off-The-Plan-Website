"use client";

import { AccordionSection } from "../fields/accordion-section";
import { inp, lbl, g2 } from "../constants";
import type { CategorySlice } from "../use-listing-form-state";

// Canonical listing taxonomy — matches the public site + portal. The admin
// form and the portal form both use this one list (was previously a separate
// legacy set: Apartment / Townhouse / Villa / Land / Mixed Use).
const PORTAL_TYPES = [
  "New Apartments", "Townhouses", "Land and Estates",
  "Commercial", "House & Land",
  "Over 55's / Retirement",
];

interface Props {
  isPortal: boolean;
  category: CategorySlice;
  setCategory: (p: Partial<CategorySlice>) => void;
}

export function CategorySection({ isPortal, category, setCategory }: Props) {
  return (
    <AccordionSection title="Category" defaultOpen>
      <div className={g2}>
        <div>
          <label className={lbl}>Listing Type</label>
          <select value={category.type} onChange={(e) => setCategory({ type: e.target.value })} className={inp + " cursor-pointer"}>
            <option value="">— Select type —</option>
            {/* One canonical taxonomy everywhere. If this listing was saved
                with a legacy value not in the list (e.g. "Land", "Villa",
                "Mixed Use"), keep showing it so the value isn't silently
                wiped — re-selecting a proper name canonicalises it. */}
            {(!category.type || PORTAL_TYPES.includes(category.type) ? PORTAL_TYPES : [category.type, ...PORTAL_TYPES]).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {!isPortal && (
          <div>
            <label className={lbl}>Tier</label>
            <select value={category.tier} onChange={(e) => setCategory({ tier: e.target.value })} className={inp + " cursor-pointer"}>
              <option value="">— No tier —</option>
              <option value="1st Tier">1st Tier</option>
              <option value="2nd Tier">2nd Tier</option>
            </select>
            <p className="font-sans text-[11px] text-ink/40 mt-1 leading-relaxed">
              <strong className="text-ink/60">1st Tier</strong> — featured carousel on the homepage.{" "}
              <strong className="text-ink/60">2nd Tier</strong> — second homepage row.{" "}
              <strong className="text-ink/60">No tier</strong> — listing appears in search results only.
            </p>
          </div>
        )}
      </div>
    </AccordionSection>
  );
}
