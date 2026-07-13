import {
  CATEGORY_TO_SLUG,
  RESERVED_TOP_LEVEL_SEGMENTS,
  FALLBACK_CATEGORY_SLUG,
  categorySlug,
  isValidCategorySlug,
  listingPath,
} from "@/lib/listing-url";

const categorySlugs = Object.values(CATEGORY_TO_SLUG);

describe("listing-url category slugs", () => {
  // The core collision guard the whole scheme depends on: because listings
  // sit at the root, a category slug that equals a top-level route (e.g.
  // "journal") would be permanently shadowed by that static route. Adding a
  // colliding category should fail HERE, before it ever ships.
  it("never collides with a reserved top-level route segment", () => {
    for (const slug of categorySlugs) {
      expect(RESERVED_TOP_LEVEL_SEGMENTS.has(slug)).toBe(false);
    }
  });

  it("is a URL-safe lower-case slug (letters, digits, hyphens only)", () => {
    for (const slug of categorySlugs) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("does not reuse the fallback slug for a real category", () => {
    expect(categorySlugs).not.toContain(FALLBACK_CATEGORY_SLUG);
  });
});

describe("categorySlug()", () => {
  it("maps known types to their canonical slug", () => {
    expect(categorySlug("Townhouses")).toBe("townhouses");
    expect(categorySlug("New Apartments")).toBe("new-apartments");
    expect(categorySlug("Apartments")).toBe("new-apartments"); // legacy alias
    expect(categorySlug("House & Land")).toBe("house-and-land");
    expect(categorySlug("Over 55's / Retirement")).toBe("retirement");
  });

  it("falls back for null / unknown types", () => {
    expect(categorySlug(null)).toBe(FALLBACK_CATEGORY_SLUG);
    expect(categorySlug(undefined)).toBe(FALLBACK_CATEGORY_SLUG);
    expect(categorySlug("Something Nonexistent")).toBe(FALLBACK_CATEGORY_SLUG);
  });
});

describe("isValidCategorySlug()", () => {
  it("accepts every real category slug and the fallback", () => {
    for (const slug of [...categorySlugs, FALLBACK_CATEGORY_SLUG]) {
      expect(isValidCategorySlug(slug)).toBe(true);
    }
  });

  it("rejects unrelated top-level paths", () => {
    for (const seg of ["about", "journal", "developers", "made-up"]) {
      expect(isValidCategorySlug(seg)).toBe(false);
    }
  });
});

describe("listingPath()", () => {
  it("builds a canonical /category/slug path", () => {
    expect(listingPath({ type: "Townhouses", slug: "aria-residences" })).toBe(
      "/townhouses/aria-residences",
    );
  });

  it("uses the fallback segment when type is missing", () => {
    expect(listingPath({ type: null, slug: "aria-residences" })).toBe(
      "/listings/aria-residences",
    );
  });
});
