import { buildPayload, type ListingPayloadState } from "@/features/listings/admin-form/build-payload";

// Fixture with representative values across every field group.
const state: ListingPayloadState = {
  isNew: false,
  id: "abc-123",
  type: "Townhouses",
  tier: "1st Tier",
  name: "Test Estate",
  slug: "test-estate",
  developerId: "dev-1",
  portalDeveloperName: "",
  ownerUserId: "user-1",
  developerWebsite: "https://example.com",
  listingDuration: "",
  logoUrl: "",
  residenceCount: 24,
  streetAddress: "1 Main St",
  streetAddress2: "",
  country: "Australia",
  state: "VIC",
  city: "Melbourne",
  postcode: "3000",
  suburb: "Melbourne",
  locationDescription: "",
  saleOfficeStreet: "",
  saleOfficeStreet2: "",
  saleOfficeCountry: "",
  saleOfficeState: "",
  saleOfficeCity: "",
  saleOfficePostcode: "",
  displaySuiteTiming: "",
  description: "<p>Nice <strong>place</strong></p>",
  status: "Selling now",
  isPublished: true,
  isFeatured: false,
  lat: -37.81,
  lng: 144.96,
  priceFrom: 660000,
  searchPriceMax: "",
  priceDisplay: "Fr. $660,000",
  showPriceOnSearch: true,
  promotionalBanner: "",
  completionQuarter: "Q4 2027",
  configurationLabel: "",
  bedsMin: 2,
  bedsMax: 4,
  bathsMin: "",
  bathsMax: "",
  carsMin: 1,
  carsMax: 2,
  levels: "",
  internalSqmMin: "",
  internalSqmMax: "",
  landSizeMin: "",
  landSizeMax: "",
  lifestyle: ["Parks"],
  features: [],
  architect: "",
  interiors: "",
  landscape: "",
  builder: "Test Builder",
  nearbyAmenities: [],
  agentName: "",
  agentPhone: "",
  agentEmail: "",
  agentAgency: "",
  heroImageUrl: "https://example.com/hero.jpg",
  heroAltText: "",
  featureImageUrl: "",
  brochureUrl: "",
  videoUrl: "",
  agentLogo1: "",
  agentLogo2: "",
  virtualTourUrl: "",
  floorPlanUploadUrl: "",
  additionalVideoUrl: "",
  priceListUrl: "",
  specificationsUrl: "",
  seoTitle: "",
  seoDescription: "",
  floorPlans: [],
  miniStocklist: [
    { bed: "3", bath: "2", parking: "1", size: "150", price: "Fr. $700,000" },
    { bed: "", bath: "", parking: "", size: "", price: "" }, // empty row — must be filtered out
  ],
};

describe("buildPayload", () => {
  it("wire format snapshot — key order is the autosave fingerprint, do not reorder", () => {
    // The autosave fingerprint is JSON.stringify(payload); this snapshot
    // fails if keys are added/removed/reordered or coercions change.
    expect(JSON.stringify(buildPayload(state))).toMatchSnapshot();
  });

  it("uses POST without id for new listings, PATCH with id otherwise", () => {
    expect(buildPayload({ ...state, isNew: true })._method).toBe("POST");
    expect(buildPayload({ ...state, isNew: true }).id).toBeUndefined();
    expect(buildPayload(state)._method).toBe("PATCH");
    expect(buildPayload(state).id).toBe("abc-123");
  });

  it("coerces empty strings to null and keeps numbers", () => {
    const p = buildPayload(state);
    expect(p.search_price_max).toBeNull();
    expect(p.price_from).toBe(660000);
    expect(p.beds_min).toBe(2);
    expect(p.levels).toBeNull();
    expect(p.portal_developer_name).toBeNull();
  });

  it("derives plain-text description and summary from the html", () => {
    const p = buildPayload(state);
    expect(p.description_html).toBe("<p>Nice <strong>place</strong></p>");
    expect(p.description).toBe("Nice place");
    expect(p.summary).toBe("Nice place");
    const empty = buildPayload({ ...state, description: "" });
    expect(empty.description_html).toBeNull();
    expect(empty.description).toBeNull();
  });

  it("nulls empty arrays but keeps populated ones", () => {
    const p = buildPayload(state);
    expect(p.lifestyle).toEqual(["Parks"]);
    expect(p.features).toBeNull();
    expect(p.nearby_amenities).toBeNull();
  });

  it("drops mini-stocklist rows with no user input", () => {
    const p = buildPayload(state);
    expect(p.mini_stocklist).toHaveLength(1);
    expect(p.mini_stocklist[0].bed).toBe("3");
  });
});
