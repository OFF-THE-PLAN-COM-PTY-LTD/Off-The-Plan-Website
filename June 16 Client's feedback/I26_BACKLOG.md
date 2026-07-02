# I26 Backlog — findings surfaced during end-to-end test

**Started:** 2026-06-30
**Test account:** ched+meridiantestfinal@meetapex.ai (Meridian Living / Developer)
**Test listing:** Azure Beachfront Residences (Scarborough WA)

Items below were found while walking Tim's I26 test package through the site. Fixes-inline are already committed to `main`; the entries here are **outstanding** — either intentionally parked, or requiring a legacy comparison / larger scope before we touch them.

---

## Priority key

- 🔴 **Critical** — Ched flagged this as needing to be fixed
- 🟠 **Verify vs legacy first** — could be a photocopy behaviour, not a regression. Don't fix until we confirm the legacy admin behaves differently.
- 🟡 **Real gap** — genuine data-model or UX gap that affects real developers
- ⚪ **Separate investigation** — not caused by I26 work; needs its own diagnostic
- 🔵 **Owned by another developer** — not our team to fix; tracked here so it's not forgotten

---

## Findings

| # | Priority | Title | Notes | Est. |
|---|---|---|---|---|
| 1 | ✅ **Done 2026-07-02** | **Two-pass save on the listing form** | Fixed via draft-first + autosave. `/portal/listings/new` immediately creates an empty draft and redirects to the edit page — all child sections unlocked from first click. Debounced 3-second autosave silently PATCHes as the user types, with a "✓ Saved" indicator next to the Save button. "View Listing" button also hidden on unpublished drafts (was showing 404). Follow-up (parked): stale abandoned drafts cleanup job. | Done |
| 2 | ⏭️ **Skipped 2026-07-02** | **Project By (Developer) field auto-fill** | Ched decided to skip — typing the company name once is a trivial friction, not worth the change. Field stays as free-text input. | Skipped |
| 3 | ⏭️ **Skipped 2026-07-02** | **Selling Agent form fields too thin** | Legacy also only has Name / Email / Mobile / Photo — confirmed via Ched's screenshot of `offtheplan.com.au/listing_detail`. Ours matches legacy exactly, so no change needed. The Word doc fields (Title, Agency, Office, Licence, Bio) can go in the description if a developer needs them. | Skipped |
| 4 | ✅ **Done 2026-07-02** | **Save button UX has no success confirmation** | Fixed: inline Save button on each Selling Agent row now flips to "✓ Saved" for 2.5s after a successful save (green border + light green background), then fades back to "Save". Bottom form Save is already covered by the autosave "✓ Saved" pill added with backlog #1. | Done |
| 5 | 🟡 | **Configuration Summary schema too thin** | No apartment type name (The Marina / The Esplanade / etc.), no aspect/orientation, no separate balcony area. All the Word doc's per-type data can't fit in the current schema — 4 rows × (Beds, Bath, Garage, Total Size, Price From) only. Real off-the-plan listings need at least a type name and aspect. | 3–5h (schema + form + card render) |
| 6 | 🟡 | **`beds` column is integer** | Can't hold "3 + Study" (The Horizon config in the Word doc). Currently we lose the "+ Study" info. Options: change to text, or add a "config detail" text column alongside. | 30min DB + form |
| 7 | 🟡 | **`frontage_m` and `depth_m` columns are integer** | Land & Estates listings routinely have decimals (12.5m frontage). Change to numeric — same fix pattern as `bath` already done today. Not relevant for apartments; blocks Land & Estates category. | 15min |
| 8 | 🟡 | **Optional Uploads gap** | Section exists (floor plans, brochure PDF, price list, specifications, 3D tour) but easy for developers to overlook. Real listings would use these. Consider surfacing more prominently or renaming the section. | 30min |
| 9 | 🟡 | **Property Features preset list missing common items** | Word doc had "storerooms for every residence", "pet-friendly building", "bicycle storage" — none in the preset checklist, all had to use "Add your own." Add these three (and any obvious peers) to the standard preset. | 30min |
| 10 | ⚪ | **Agencies table row count anomaly** | `agencies` table shows 121 rows on `/admin/agencies`. Legacy site's "All Agency" table had 38 rows (per screenshots). Our import script added those 38; today's backfill added 7 more. That accounts for 45, not 121. Where did the other 76 come from? Possibly duplicates from a legacy signup form, a re-run import, or the legacy site writing to the same DB. Investigate before Tim sees the count. | 30min–2h to diagnose |
| 11 | 🔵 **Owned by another developer** | **Payment / Billing integration** | `/portal/billing` is a stub — no Stripe or subscription flow wired up. **Not for us** — another developer on the team is responsible for this piece. Included here so it's not forgotten. Skipped during the I26 test (Step 5) and flagged to Tim. | (out of scope for us) |

---

## Already fixed inline today (for reference — not in backlog)

- Middleware blocking portal from `/api/admin/*` endpoints — portal Developer/Agent members can now hit upload/agents/gallery/listings routes
- `agencies.portal_status` CHECK constraint rejecting `'pending'` — added to the allowed list
- Signup auto-approves developer/agent accounts (per Tim's 2026-06-30 email) — no admin approval gate
- Listing form Back / Save / Preview / Delete buttons restyled with brand colors (black / green / orange / red)
- Portal-mode Back link now goes to `/portal/listings` (was hardcoded to `/admin/listings` and got bounced by middleware)
- Configuration Summary silent-save-failure now surfaces the actual error message
- `development_floor_plans.bath` column widened from integer to numeric (so 2.5 baths save)
- Members + Upgrade Requests admin tabs hidden (consolidated into All Agencies)
- Pending tab on All Agencies hidden (auto-approve makes it always empty)
- Developers admin + public nav item hidden (per client, may bring back later)
- Admin members page annotated as fallback (writes there don't reach agencies)

---

## Working process (agreed with Ched)

1. Finish remaining I26 test steps (6–10) first
2. Any new issues encountered during steps 6–10 → append to this file
3. Once I26 walkthrough is complete, work through this backlog in priority order
4. Item 1 (two-pass save) is Ched's top concern; verify against legacy admin first before scoping the fix
