import {
  DEVELOPMENT_CARD_SELECT,
  DEVELOPMENT_GRID_SELECT,
  DEVELOPMENT_DETAIL_SELECT,
  DEVELOPMENT_HERO_SELECT,
  DEVELOPMENT_META_SELECT,
} from "@/features/listings/queries";

// Change-detector: these strings were extracted verbatim from the pages that
// previously inlined them (home, search, developer detail, listing detail).
// If one changes, every consumer changes with it — make sure that's intended.
describe("development select constants", () => {
  it("card select matches the original inline string", () => {
    expect(DEVELOPMENT_CARD_SELECT).toBe(
      "*, developer:accounts!account_id(*), images:development_images(*), floor_plans:development_floor_plans(*)",
    );
  });

  it("grid select stays slim (no description_html / full embeds)", () => {
    expect(DEVELOPMENT_GRID_SELECT).toBe(
      "id, slug, name, suburb, state, price_from, price_display, beds_min, beds_max, completion_quarter, type, tag, tier, status, is_featured, summary, hero_image_url, developer:accounts!account_id(name, logo_url), images:development_images(url, is_hero), floor_plans:development_floor_plans(*)",
    );
    // Guard the whole point of the slim select: the heavy scraped-HTML column
    // and full nested embeds must never sneak back into the grid payload.
    expect(DEVELOPMENT_GRID_SELECT).not.toContain("description_html");
    expect(DEVELOPMENT_GRID_SELECT).not.toContain("accounts!account_id(*)");
    expect(DEVELOPMENT_GRID_SELECT.startsWith("*")).toBe(false);
  });

  it("detail select is the card select plus listing agents", () => {
    expect(DEVELOPMENT_DETAIL_SELECT).toBe(
      "*, developer:accounts!account_id(*), images:development_images(*), floor_plans:development_floor_plans(*), listing_agents:listing_agents(name, email, mobile, photo_url, sort_order)",
    );
  });

  it("hero select matches the original inline string", () => {
    expect(DEVELOPMENT_HERO_SELECT).toBe("hero_image_url, images:development_images(url)");
  });

  it("meta select matches the original inline string", () => {
    expect(DEVELOPMENT_META_SELECT).toBe(
      "name, suburb, state, summary, hero_image_url, images:development_images(*)",
    );
  });
});
