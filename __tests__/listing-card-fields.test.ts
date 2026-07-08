import {
  getCardFields,
  getStocklistFields,
  DEFAULT_CARD_FIELDS,
} from "@/lib/listing-card-fields";

const keys = (fields: { key: string; stocklistKey?: string }[]) => fields.map((f) => f.key);
const stockKeys = (fields: { key: string; stocklistKey?: string }[]) =>
  fields.map((f) => f.stocklistKey ?? f.key);

// Per dev spec v4 (PDF pages 2–7). These assertions lock in the per-category
// Configuration Summary + Mini Stocklist field sets so a future "match legacy"
// revert can't silently re-flatten them again.
describe("per-category Configuration Summary (card) fields", () => {
  test("Land and Estates → Lot No. / Land Area / Frontage / Depth", () => {
    expect(keys(getCardFields("Land and Estates"))).toEqual([
      "lot_number",
      "land_area_sqm",
      "frontage_m",
      "depth_m",
    ]);
  });

  test("House & Land → Beds / Bath / Garage / Land Size", () => {
    expect(keys(getCardFields("House & Land"))).toEqual([
      "beds",
      "bath",
      "garage",
      "land_size_sqm",
    ]);
  });

  test("Commercial → Floor Area / Level / Car Spaces (3 fields)", () => {
    const card = getCardFields("Commercial");
    expect(card).toHaveLength(3);
    expect(keys(card)).toEqual(["floor_area_sqm", "level", "garage"]);
  });

  test("residential categories keep the default set", () => {
    for (const type of ["New Apartments", "Townhouses", "Over 55's / Retirement"]) {
      expect(getCardFields(type)).toEqual(DEFAULT_CARD_FIELDS);
    }
  });

  test("unknown / null type falls back to the default set", () => {
    expect(getCardFields(undefined)).toEqual(DEFAULT_CARD_FIELDS);
    expect(getCardFields("Something Else")).toEqual(DEFAULT_CARD_FIELDS);
  });

  test("card never exceeds the 4-field limit", () => {
    for (const type of [
      "New Apartments",
      "Townhouses",
      "Land and Estates",
      "House & Land",
      "Commercial",
      "Over 55's / Retirement",
    ]) {
      expect(getCardFields(type).length).toBeLessThanOrEqual(4);
    }
  });
});

describe("per-category Mini Stocklist fields", () => {
  test("House & Land stocklist adds House Size + Frontage on top of the card", () => {
    expect(stockKeys(getStocklistFields("House & Land"))).toEqual([
      "bed",
      "bath",
      "parking",
      "house_size",
      "land_size",
      "frontage",
    ]);
  });

  test("Commercial stocklist adds Unit/Suite No. + Property Sub-Type", () => {
    expect(stockKeys(getStocklistFields("Commercial"))).toEqual([
      "unit_suite_no",
      "property_sub_type",
      "floor_area",
      "level",
      "parking",
    ]);
  });

  test("Land and Estates stocklist defaults to its card fields", () => {
    expect(stockKeys(getStocklistFields("Land and Estates"))).toEqual([
      "lot_number",
      "land_area",
      "frontage",
      "depth",
    ]);
  });
});
