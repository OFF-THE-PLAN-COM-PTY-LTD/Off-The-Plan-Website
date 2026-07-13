"use client";

import { featuresForCategory } from "@/features/listings/category-features";
import { AccordionSection } from "../fields/accordion-section";
import { AddYourOwn } from "../fields/add-your-own";

// The checklist below is derived from the currently selected
// Category (e.g. Commercial shows business-focused features like
// 'Grease trap', 'Shop Front'; residential categories show
// 'Fully Equipped Gym', 'BBQ Facilities' etc.). Mirrors the
// per-category taxonomy on the existing live admin. Any custom
// features the user added previously remain visible via
// AddYourOwn even if they're not in the current category's
// standard list.

interface Props {
  type: string;
  lifestyle: string[];
  toggleLifestyle: (item: string) => void;
  setLifestyle: React.Dispatch<React.SetStateAction<string[]>>;
}

export function FeaturesSection({ type, lifestyle, toggleLifestyle, setLifestyle }: Props) {
  return (
    <AccordionSection title="Property Features">
      {(() => {
        const categoryFeatures = featuresForCategory(type);
        return (
          <>
            <p className="font-sans text-sm text-ink/50 mb-4">
              ( At least select one property feature is required ){" "}
              <span className="text-red-500">*</span>
              {type && (
                <span className="block text-xs text-ink/40 mt-1">
                  Showing the {type} feature set. Change the Category in
                  Section 1 to see a different list.
                </span>
              )}
            </p>
            <div className="grid grid-cols-3 gap-y-3 gap-x-4">
              {categoryFeatures.map((item) => (
                <label key={item} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lifestyle.includes(item)}
                    onChange={() => toggleLifestyle(item)}
                    className="w-4 h-4 accent-orange flex-shrink-0"
                  />
                  <span className="font-sans text-sm text-ink/80">{item}</span>
                </label>
              ))}
            </div>
            <AddYourOwn lifestyle={lifestyle} setLifestyle={setLifestyle} standardOptions={categoryFeatures} />
          </>
        );
      })()}
    </AccordionSection>
  );
}
