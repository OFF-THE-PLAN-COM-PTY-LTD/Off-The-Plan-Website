/**
 * Legacy carry-over baseline for site-wide admin analytics.
 *
 * Background: the June 2026 one-off import (scripts/import-legacy-data.mjs)
 * matched legacy projects to new listings *by name*, and only ~43 of 58
 * listings matched. Everything whose name didn't line up was silently
 * skipped, so the new site's totals are a partial subset of the old site's
 * rather than a superset of them.
 *
 * Rather than fabricate the missing records, each value below is the plain
 * difference between the legacy dashboard and current production:
 *
 *     baseline = legacy total − current production total   (21 Jul 2026)
 *
 *   views      40166 − 9210 = +30956
 *   enquiries    574 −  113 =   +461
 *   phoneClicks  112 −  106 =     +6
 *   shares         0 −    2 =     −2
 *
 * Adding these to the live figures reproduces the legacy numbers exactly
 * today, and they keep climbing correctly as new activity is recorded.
 * Note that `shares` is negative on purpose: the old site never tracked
 * shares, so the offset renders 0 without deleting the 2 genuine share
 * records we already hold.
 *
 * Caveat: these correct the *totals* only. The underlying per-listing
 * counters are still short by whatever the failed import missed, so the
 * listing rows in a table will not sum to the total shown in the header
 * above them. Recovering the legacy export is the only fix for that.
 *
 * IMPORTANT: these are site-wide totals. Do not apply them to per-agency
 * views (the /portal dashboards, or /admin/listings filtered by agency) —
 * that would add the entire site's legacy history to a single agency.
 *
 * Retire this module once the legacy export is recovered and imported
 * properly; at that point every value here should go to 0.
 */
export const LEGACY_BASELINE = {
  views: 30956,
  enquiries: 461,
  phoneClicks: 6,
  shares: -2,
} as const;

/** Clamp to 0 so a negative offset can never render a negative stat. */
export function withBaseline(live: number, offset: number): number {
  return Math.max(0, live + offset);
}
