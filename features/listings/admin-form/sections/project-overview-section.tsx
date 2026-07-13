"use client";

import Image from "next/image";
import { ImageUpload } from "@/features/admin/components/image-upload";
import { RichTextEditor } from "@/features/admin/components/rich-text-editor";
import { AccordionSection } from "../fields/accordion-section";
import { SectionDivider } from "../fields/section-divider";
import { ExampleHint } from "../fields/example-hint";
import { inp, lbl, g2, g3, g4, g5 } from "../constants";
import type { Developer, Member } from "../types";
import type {
  CategorySlice,
  OverviewSlice,
  AddressSlice,
  SaleOfficeSlice,
  DetailsSlice,
  PricingSlice,
} from "../use-listing-form-state";

const AU_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

const STATUSES = [
  "Selling now", "Final release", "Register interest", "Cancelled", "Archived",
];

const LISTING_DURATIONS = ["3 Months", "6 Months", "12 Months", "24 Months"];

interface Props {
  isNew: boolean;
  isPortal: boolean;
  developers: Developer[];
  members: Member[];
  category: CategorySlice;
  overview: OverviewSlice;
  address: AddressSlice;
  saleOffice: SaleOfficeSlice;
  details: DetailsSlice;
  pricing: PricingSlice;
  setOverview: (p: Partial<OverviewSlice>) => void;
  setAddress: (p: Partial<AddressSlice>) => void;
  setSaleOffice: (p: Partial<SaleOfficeSlice>) => void;
  setDetails: (p: Partial<DetailsSlice>) => void;
  setPricing: (p: Partial<PricingSlice>) => void;
}

export function ProjectOverviewSection({
  isNew,
  isPortal,
  developers,
  members,
  category,
  overview,
  address,
  saleOffice,
  details,
  pricing,
  setOverview,
  setAddress,
  setSaleOffice,
  setDetails,
  setPricing,
}: Props) {
  return (
    <AccordionSection title="Project Overview" defaultOpen={isNew}>

      {/* Row 1: name + listing duration */}
      <div className={g2}>
        <div>
          <label className={lbl}>Project Name *</label>
          <input type="text" value={overview.name} onChange={(e) => setOverview({ name: e.target.value })} required className={inp} />
        </div>
        <div>
          <label className={lbl}>Listing Duration</label>
          <select value={overview.listingDuration} onChange={(e) => setOverview({ listingDuration: e.target.value })} className={inp + " cursor-pointer"}>
            <option value="">— Select —</option>
            {(isPortal ? ["6 Months", "12 Months"] : LISTING_DURATIONS).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Row 2: developer + website + number of residences */}
      <div className={`${g3} mt-4`}>
        <div>
          <label className={lbl}>Project By (Developer)</label>
          {isPortal ? (
            <input
              type="text"
              value={overview.portalDeveloperName}
              onChange={(e) => setOverview({ portalDeveloperName: e.target.value })}
              placeholder="e.g. ABC Developers Pty Ltd"
              className={inp}
            />
          ) : (
            <select value={overview.developerId} onChange={(e) => setOverview({ developerId: e.target.value })} className={inp + " cursor-pointer"}>
              <option value="">— No developer —</option>
              {developers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
        </div>
        <div>
          <label className={lbl}>Developer Website URL</label>
          <input type="url" value={overview.developerWebsite} onChange={(e) => setOverview({ developerWebsite: e.target.value })} placeholder="https://..." className={inp} />
        </div>
        <div>
          <label className={lbl}>{category.type === "Townhouses" ? "Number of Homes" : "Number of Apartments / Lots"}</label>
          <input type="number" value={overview.residenceCount} onChange={(e) => setOverview({ residenceCount: e.target.value === "" ? "" : Number(e.target.value) })} className={inp} />
        </div>
      </div>

      {/* Row 3: assign to account — admin only */}
      {!isPortal && (
        <div className="mt-4">
          <label className={lbl}>Assign to Account <span className="normal-case font-sans text-ink/40 text-xs">(Developer or Agent account)</span></label>
          <select value={overview.ownerUserId} onChange={(e) => setOverview({ ownerUserId: e.target.value })} className={inp + " cursor-pointer"}>
            <option value="">— Unassigned —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name ?? "Unnamed"} — {m.interest_type}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Project logo */}
      <div className="mt-5">
        <ImageUpload label="Project Logo" value={overview.logoUrl} onChange={(v) => setOverview({ logoUrl: v })} bucket="development-images" />
      </div>

      {/* URL slug — admin only */}
      {!isPortal && (
        <div className="mt-4">
          <label className={lbl}>URL Slug *</label>
          <input type="text" value={overview.slug} onChange={(e) => setOverview({ slug: e.target.value })} required className={inp + " font-mono text-label-lg"} />
        </div>
      )}

      {/* ── Address ── */}
      <SectionDivider label="Address" />
      <div className={`${g4} mb-4`}>
        <div>
          <label className={lbl}>Street Address *</label>
          <input type="text" value={address.streetAddress} onChange={(e) => setAddress({ streetAddress: e.target.value })} placeholder="e.g. 35" className={inp} />
        </div>
        <div>
          <label className={lbl}>Street Address 2 *</label>
          <input type="text" value={address.streetAddress2} onChange={(e) => setAddress({ streetAddress2: e.target.value })} placeholder="e.g. Northumberland Road" className={inp} />
        </div>
        <div>
          <label className={lbl}>Suburb</label>
          <input type="text" value={address.suburb} onChange={(e) => setAddress({ suburb: e.target.value })} className={inp} />
        </div>
        <div>
          <label className={lbl}>City</label>
          <input type="text" value={address.city} onChange={(e) => setAddress({ city: e.target.value })} className={inp} />
        </div>
        <div>
          <label className={lbl}>State</label>
          <select value={address.state} onChange={(e) => setAddress({ state: e.target.value })} className={inp + " cursor-pointer"}>
            <option value="">Select</option>
            {AU_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>PostCode</label>
          <input type="text" value={address.postcode} onChange={(e) => setAddress({ postcode: e.target.value })} className={inp} />
        </div>
        <div>
          <label className={lbl}>Country</label>
          <input type="text" value={address.country} onChange={(e) => setAddress({ country: e.target.value })} placeholder="Australia" className={inp} />
        </div>
      </div>
      <div>
        <label className={lbl}>Location Description</label>
        <textarea rows={3} value={address.locationDescription} onChange={(e) => setAddress({ locationDescription: e.target.value })} className={inp + " resize-none"} />
      </div>

      {/* ── Sale Office Address ── */}
      <SectionDivider label="Sale Office Address (if different to above)" />
      <div className={g4}>
        <div>
          <label className={lbl}>Street Address</label>
          <input type="text" value={saleOffice.saleOfficeStreet} onChange={(e) => setSaleOffice({ saleOfficeStreet: e.target.value })} className={inp} />
        </div>
        <div>
          <label className={lbl}>Street Address 2</label>
          <input type="text" value={saleOffice.saleOfficeStreet2} onChange={(e) => setSaleOffice({ saleOfficeStreet2: e.target.value })} className={inp} />
        </div>
        <div>
          <label className={lbl}>City</label>
          <input type="text" value={saleOffice.saleOfficeCity} onChange={(e) => setSaleOffice({ saleOfficeCity: e.target.value })} className={inp} />
        </div>
        <div>
          <label className={lbl}>State</label>
          <select value={saleOffice.saleOfficeState} onChange={(e) => setSaleOffice({ saleOfficeState: e.target.value })} className={inp + " cursor-pointer"}>
            <option value="">Select</option>
            {AU_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>PostCode</label>
          <input type="text" value={saleOffice.saleOfficePostcode} onChange={(e) => setSaleOffice({ saleOfficePostcode: e.target.value })} className={inp} />
        </div>
        <div>
          <label className={lbl}>Country</label>
          <input type="text" value={saleOffice.saleOfficeCountry} onChange={(e) => setSaleOffice({ saleOfficeCountry: e.target.value })} placeholder="Australia" className={inp} />
        </div>
      </div>

      {/* ── Timing & Description ── */}
      <SectionDivider label="Listing Details" />
      <div className="mb-4">
        <label className={lbl}>Display Suite Timing</label>
        <textarea
          rows={2}
          value={details.displaySuiteTiming}
          onChange={(e) => setDetails({ displaySuiteTiming: e.target.value })}
          placeholder="e.g. Monday to Sunday 10am – 6pm"
          className={inp + " resize-none"}
        />
      </div>
      <div className="mb-4">
        <label className={lbl}>Listing Description *</label>
        <RichTextEditor
          value={details.description}
          onChange={(v) => setDetails({ description: v })}
          minHeight={260}
        />
        <p className="font-sans text-[11px] text-ink/40 mt-1">
          Use the toolbar to add bold, italic, headings, lists, links and images. Formatting will be preserved on the public listing page.
        </p>
      </div>

      {/* ── Pricing & dates ── */}
      <SectionDivider label="Pricing &amp; Dates" />
      <div className={`${g5} mb-4`}>
        <div>
          <label className={lbl}>Search Price Minimum ($) *</label>
          <input type="number" value={pricing.priceFrom} onChange={(e) => setPricing({ priceFrom: e.target.value === "" ? "" : Number(e.target.value) })} placeholder="450000" className={inp} />
        </div>
        <div>
          <label className={lbl}>Search Price Maximum ($) *</label>
          <input type="number" value={pricing.searchPriceMax} onChange={(e) => setPricing({ searchPriceMax: e.target.value === "" ? "" : Number(e.target.value) })} placeholder="1275000" className={inp} />
        </div>
        <div>
          <label className={lbl}>Completion Date *</label>
          <input type="text" value={pricing.completionQuarter} onChange={(e) => setPricing({ completionQuarter: e.target.value })} placeholder="e.g. Q1 2028" className={inp} />
        </div>
        <div>
          <label className={lbl}>
            Lead In Pricing
            <ExampleHint title="Where Lead In Pricing appears">
              <p>This is the headline price shown on the listing card on search results. Free-text, so you can write "From $650,000", "Contact Agent", "Auction", etc.</p>
              <Image
                src="/examples/lead-in-pricing.png"
                alt="Example: where Lead In Pricing appears on the listing card"
                width={1824}
                height={681}
                className="w-full h-auto border border-line rounded-sm"
              />
            </ExampleHint>
          </label>
          <input type="text" value={pricing.priceDisplay} onChange={(e) => setPricing({ priceDisplay: e.target.value })} placeholder="e.g. From $650,000" className={inp} />
        </div>
        {!isPortal && (
          <div>
            <label className={lbl}>Promotional Banner</label>
            <input type="text" value={pricing.promotionalBanner} onChange={(e) => setPricing({ promotionalBanner: e.target.value })} placeholder="e.g. 2 BED FI $775,000" className={inp} />
          </div>
        )}
      </div>
      <div className="mb-4">
        <label className={lbl}>
          Configuration{" "}
          <span className="font-sans text-xs text-ink/40 font-normal">(max 25 characters)</span>
          <ExampleHint title="Where the Configuration label appears">
            <p>A short summary chip shown beneath the category badge on the listing card. Keep it under 25 characters so it fits without wrapping.</p>
            <Image
              src="/examples/configuration.png"
              alt="Example: where the Configuration label appears"
              width={1294}
              height={1045}
              className="w-full h-auto border border-line rounded-sm"
            />
          </ExampleHint>
        </label>
        <input
          type="text"
          value={pricing.configurationLabel}
          onChange={(e) => setPricing({ configurationLabel: e.target.value.slice(0, 25) })}
          placeholder="e.g. 1, 2 & 3 Bedrooms"
          maxLength={25}
          className={inp}
        />
        <p className="font-mono text-label-sm text-ink/30 mt-1">
          {pricing.configurationLabel.length} / 25 chars
        </p>
      </div>
      <label className="flex items-center gap-3 cursor-pointer mb-4">
        <input type="checkbox" checked={pricing.showPriceOnSearch} onChange={(e) => setPricing({ showPriceOnSearch: e.target.checked })} className="w-4 h-4 accent-orange" />
        <span className="section-label">Display price on search results</span>
      </label>

      {/* ── Visibility ── admin only */}
      {!isPortal && (
        <>
          <SectionDivider label="Visibility &amp; Location" />
          <div className={`${g2} mb-4`}>
            <div>
              <label className={lbl}>Status</label>
              <select value={details.status} onChange={(e) => setDetails({ status: e.target.value })} className={inp + " cursor-pointer"}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-3 mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={details.isPublished} onChange={(e) => setDetails({ isPublished: e.target.checked })} className="w-4 h-4 accent-orange" />
              <span className="section-label">Published (visible on site)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={details.isFeatured} onChange={(e) => setDetails({ isFeatured: e.target.checked })} className="w-4 h-4 accent-orange" />
              <span className="section-label">Featured on homepage</span>
            </label>
          </div>
          <div className={g2}>
            <div>
              <label className={lbl}>Latitude</label>
              <input type="number" step="any" value={details.lat} onChange={(e) => setDetails({ lat: e.target.value === "" ? "" : Number(e.target.value) })} placeholder="e.g. -33.8688" className={inp} />
            </div>
            <div>
              <label className={lbl}>Longitude</label>
              <input type="number" step="any" value={details.lng} onChange={(e) => setDetails({ lng: e.target.value === "" ? "" : Number(e.target.value) })} placeholder="e.g. 151.2093" className={inp} />
            </div>
          </div>
          <p className="font-sans text-xs text-ink/40 mt-2">
            Tip: right-click any location in Google Maps → copy the coordinates shown at the top.
          </p>
        </>
      )}
    </AccordionSection>
  );
}
