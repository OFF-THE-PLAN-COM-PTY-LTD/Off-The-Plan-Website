import {
  getCardFields,
  getStocklistFields,
  DEFAULT_CARD_FIELDS,
} from "@/lib/listing-card-fields";

const cardKeys = (t: string) => getCardFields(t).map((f) => f.key);
const stockKeys = (t: string) => getStocklistFields(t).map((f) => f.stocklistKey ?? f.key);

// The single source of truth for this test: dev spec v4, "Field Visibility
// Matrix — All 6 Categories" (PDF p7) + the per-category detail (pp2–4).
// card    = Configuration Summary (results card) field keys, in order.
// stock   = Mini Stocklist field keys (stocklistKey), in order.
const EXPECTED: Record<string, { card: string[]; stock: string[] }> = {
  "New Apartments": {
    card: ["beds", "bath", "garage", "internal_sqm"],
    stock: ["bed", "bath", "parking", "size"],
  },
  Townhouses: {
    card: ["beds", "bath", "garage", "internal_sqm"],
    stock: ["bed", "bath", "parking", "size"],
  },
  "Over 55's / Retirement": {
    card: ["beds", "bath", "garage", "internal_sqm"],
    stock: ["bed", "bath", "parking", "size"],
  },
  "Land and Estates": {
    card: ["lot_number", "land_area_sqm", "frontage_m", "depth_m"],
    stock: ["lot_number", "land_area", "frontage", "depth"],
  },
  "House & Land": {
    card: ["beds", "bath", "garage", "land_size_sqm"],
    stock: ["bed", "bath", "parking", "house_size", "land_size", "frontage"],
  },
  Commercial: {
    card: ["floor_area_sqm", "level", "garage"],
    stock: ["unit_suite_no", "property_sub_type", "floor_area", "level", "parking"],
  },
};

describe("all 6 categories match the dev-spec v4 field-visibility matrix", () => {
  for (const [type, exp] of Object.entries(EXPECTED)) {
    test(`${type} — Configuration Summary card fields`, () => {
      expect(cardKeys(type)).toEqual(exp.card);
    });
    test(`${type} — Mini Stocklist fields`, () => {
      expect(stockKeys(type)).toEqual(exp.stock);
    });
    test(`${type} — card respects the 4-field cap`, () => {
      expect(getCardFields(type).length).toBeLessThanOrEqual(4);
    });
  }
});

describe("REMOVE rules from the matrix are honoured", () => {
  test("Land and Estates card has no beds/bath/garage/size", () => {
    for (const k of ["beds", "bath", "garage", "internal_sqm"]) {
      expect(cardKeys("Land and Estates")).not.toContain(k);
    }
  });
  test("Commercial card has no beds/bath and no dwelling size", () => {
    for (const k of ["beds", "bath", "internal_sqm"]) {
      expect(cardKeys("Commercial")).not.toContain(k);
    }
  });
});

describe("stocklist-only fields never leak onto the card", () => {
  test("House & Land: House Size + Frontage are stocklist-only", () => {
    expect(cardKeys("House & Land")).not.toContain("house_size_sqm");
    expect(cardKeys("House & Land")).not.toContain("frontage_m");
    expect(stockKeys("House & Land")).toEqual(
      expect.arrayContaining(["house_size", "frontage"]),
    );
  });
  test("Commercial: Unit/Suite No. + Property Sub-Type are stocklist-only", () => {
    expect(cardKeys("Commercial")).not.toContain("unit_suite_no");
    expect(cardKeys("Commercial")).not.toContain("property_sub_type");
    expect(stockKeys("Commercial")).toEqual(
      expect.arrayContaining(["unit_suite_no", "property_sub_type"]),
    );
  });
});

describe("legacy admin taxonomy aliases resolve to the same field sets", () => {
  test("'Land' → Land and Estates", () => {
    expect(cardKeys("Land")).toEqual(EXPECTED["Land and Estates"].card);
  });
  test("'Houses' → House & Land", () => {
    expect(cardKeys("Houses")).toEqual(EXPECTED["House & Land"].card);
  });
  test("legacy residential types fall back to the default set", () => {
    for (const t of ["Apartment", "Townhouse", "Villa", "Mixed Use"]) {
      expect(getCardFields(t)).toEqual(DEFAULT_CARD_FIELDS);
    }
  });
});

describe("safe fallbacks", () => {
  test("null / undefined / unknown type → default residential set", () => {
    expect(getCardFields(undefined)).toEqual(DEFAULT_CARD_FIELDS);
    expect(getCardFields(null)).toEqual(DEFAULT_CARD_FIELDS);
    expect(getCardFields("Something Else")).toEqual(DEFAULT_CARD_FIELDS);
  });
});
