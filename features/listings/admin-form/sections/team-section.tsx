"use client";

import { AccordionSection } from "../fields/accordion-section";
import { inp, lbl, g3 } from "../constants";
import type { FeaturesSlice } from "../use-listing-form-state";

// Fields already existed in schema (developments.architect/interiors/
// builder) and in state + save payload — only the input UI was
// missing. Public listing renders these under the "Team" strip on
// /listings/[slug].

interface Props {
  features: FeaturesSlice;
  setFeatures: (p: Partial<FeaturesSlice>) => void;
}

export function TeamSection({ features, setFeatures }: Props) {
  return (
    <AccordionSection title="Team">
      <div className={`${g3} mb-4`}>
        <div>
          <label className={lbl}>Architect</label>
          <input
            type="text"
            value={features.architect}
            onChange={(e) => setFeatures({ architect: e.target.value })}
            placeholder="e.g. CDArchitects"
            className={inp}
          />
        </div>
        <div>
          <label className={lbl}>Interiors</label>
          <input
            type="text"
            value={features.interiors}
            onChange={(e) => setFeatures({ interiors: e.target.value })}
            placeholder="e.g. Richards Stanisich"
            className={inp}
          />
        </div>
        <div>
          <label className={lbl}>Builder</label>
          <input
            type="text"
            value={features.builder}
            onChange={(e) => setFeatures({ builder: e.target.value })}
            placeholder="e.g. Multiplex"
            className={inp}
          />
        </div>
      </div>
    </AccordionSection>
  );
}
