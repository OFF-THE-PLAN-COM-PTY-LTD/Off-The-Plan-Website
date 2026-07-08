# OffThePlan — User Type Feature Map

> Living document. Each user type gets its own section so we can compare what every
> role can do and what they must pay to unlock more.
>
> Source: live walkthrough of `https://offtheplan.com.au` (logged-in portal)
> + code review of the current rebuild (Next.js + Supabase) in this repo.

---

## ⭐ CODEBASE VERIFICATION — Developer vs Agency in the CURRENT app

Verified against this repo's source (not the live legacy site). **Result: same overall behaviour
as the legacy site — one shared account type — with ONE small new difference the legacy site did not have.**

### How the current app models it

- **One shared self-registration endpoint** for both roles:
  [`app/api/auth/register-as-developer/route.ts`](app/api/auth/register-as-developer/route.ts).
  The form sends `role: "agency" | "developer"`, which maps to a profile field:
  `interest_type = role === "agency" ? "Agent" : "Developer"` (line 43).
- **Both roles are written to the SAME `agencies` table** and auto-approved
  (`member_status: "approved"`, `portal_status: "active"`) — see lines 97–143. So both show up
  in the unified `/admin/agencies` list, exactly like the legacy "All Agency" list.
- **Portal access is identical.** The guard treats them as one:
  [`lib/supabase/auth-guards.ts`](lib/supabase/auth-guards.ts) line 36 —
  `isMember = ["Developer", "Agent"].includes(interest_type)`. Same for the portal layout
  ([`app/portal/layout.tsx`](app/portal/layout.tsx) line 21). Listing create/edit, dashboard,
  billing → all gated on "is a member", never on which of the two.

### The ONE real difference (new in this rebuild)

- **Public Developer Directory opt-in.** In [`app/portal/profile/page.tsx`](app/portal/profile/page.tsx)
  line 27: `isDeveloperMember = interest_type === "Developer"`. Only when true does the profile show a
  **"Public Developer Directory"** toggle ([`profile-form.tsx`](app/portal/profile/profile-form.tsx)
  lines 650–652) that lets a **Developer** publish itself into the public `/developers` directory
  (backed by the `developers` table). **Agencies ("Agent") don't get this section.**

**Bottom line:** In the current app, developer and agency are still effectively the **same user type**
(same signup pipeline, same `agencies` record, same portal, same permissions). The *only* behavioural
fork is that a **Developer can opt into the public `/developers` directory** and an Agency cannot.
On the legacy site there was *no* difference at all — so the rebuild adds this one small distinction.

---

## USER TYPE 1 — Developer / Agency (Agency account)

**Account observed during walkthrough:** `Mark Trent` (madkong@hotmail.com) — an existing
agency/developer account. (Note: this is *not* the a.mutaliyev@gmail.com signup — the browser
was logged into a demo/existing agency account. The feature set is identical for any agency user.)

**Portal role:** This account can **create and manage its own property listings**, see analytics,
manage its public agency profile, and pay for listings + visibility upgrades.

### Navigation / features available (left sidebar)

| Menu item | URL | What the user can do |
|---|---|---|
| **Dashboard** | `/home` | KPI overview: Total Views, Total Enquiries, Phone Clicks, Total Share, Active Listings count, Featured Listings status. Quick links: New/View listing, Manage Profile, company + developer logos. |
| **Listing** | `/listing` | Two actions: **View Active Listing** and **Create New Listing**. Entry point to add/edit/remove property listings. |
| **Reports** | `/reports` | Per-project analytics. Pick a project → see Views, Enquiry, Shares counters + a "Total Views" line chart with a time-period filter. |
| **Manage Profile** | `/agency_profile` | Edit personal details, change password, company details, upload company logo + developer logo, and manage Social Reach links (Facebook, Instagram, LinkedIn, Pinterest, YouTube, Website). Also holds the billing **address**. |
| **Billing** | `/billing` | **View and pay invoices.** Invoice list (empty = "Data Not Found" when no invoices yet). This is the "pay" screen. |
| **Pricing** | `/pricing` | View subscription plans + paid visibility upgrades, and start a listing. |
| **Logout** | — | Sign out. |

### What the user can do WITHOUT paying more (included in the base subscription)

- **Create a listing** via `Listing → Create New Listing`. First step: choose a category
  (see category → plan mapping below), which opens the full listing editor.
- **Full listing editor** (`/listing_detail`) with collapsible sections:
  - Category & Sub Category
  - Project Overview
  - Configuration Summary
  - Property Features
  - Nearby Amenities
  - Selling Agent(s) or Contact Details
  - Uploads / Optional Uploads
  - Mini Stocklist (optional)
  - Actions: **Preview**, **Save**, **Back**
- **Edit existing listings** and view active listings.
- **Basic analytics + lead capture**: dashboard KPIs and Reports (views, enquiries, shares, phone clicks).
- **Manage public agency profile**: logos, company info, and social links.
- **View & pay invoices** in Billing.

---

## PRICING — what the user pays to get more features

### A. Base subscription (required to list — pick by property type)

| Plan | Price | For | Category options it unlocks |
|---|---|---|---|
| **Developer & Agency Listing** | **$299 / month** | New Apartments, Townhouses, Land & Estates, Commercial | New Apartments, Townhouses, Land and Estates, Commercial, Over 55's / Retirement |
| **Builders Package** | **$399 / month** | House & Land, New Home Designs | House & Land |

Both plans include:
- Low fixed rate **per listing, per month**
- Easy-to-use dashboard — upload/edit projects, **basic analytics and lead capture**
- **6 or 12 month term**
- **21-day cancellation policy**
- Billing: register → upload project → **begin subscription with a credit card** (or contact them for other payment options). Automatic monthly debit for the selected term or until cancellation.

> The **"LIST TODAY"** button on `/pricing` does **not** take payment directly — it sends the user
> into `Create New Listing`. The credit-card / subscription step is reached when the listing is
> published/activated (not during draft editing).

### B. Featured Upgrades (paid add-ons ON TOP of the subscription — billed manually)

These boost a listing's visibility. Each is requested via a button and **billed separately/manually**.

| Upgrade | Price (+GST) | Availability | What it does | Button |
|---|---|---|---|---|
| **Promo Flag** | $50 / month | All properties | Promotional flag on the listing with a short custom message | `ADD A PROMO FLAG` |
| **Featured Project — Tier 2** | $200 / month | All properties | Featured under the Home page banner (2nd row). Up to 8 available/month | `REQUEST AN UPGRADE` |
| **Featured Project — Tier 1** | $400 / month | New Apartments & Townhouses only | Featured under the Home page banner (top). Up to 6 available/month | `REQUEST AN UPGRADE` |
| **Home Page Main Banner** | $1,000 / month | New Apartments & Townhouses only | HERO project on the home page. Up to 3/month, 33% share of voice | `REQUEST AN UPGRADE` |

### Where the payment features live (summary)

1. **`/pricing`** — choose plan (subscription) + request paid upgrades.
2. **Create New Listing flow** — where the credit-card subscription is actually started.
3. **`/billing`** — view and pay invoices (subscriptions auto-debit; upgrades/other charges appear as invoices here).
4. **`/agency_profile`** — holds the billing **address** only (no stored-card manager was found in the menu).

> ⚠️ **Gap noticed:** there is no dedicated "saved payment method / manage card" screen in the
> agency menu. Card details appear to be captured only at checkout/subscription time; ongoing
> payment is handled by auto-debit + the Invoices page.

---

## USER TYPE 2 — Developer (Developer account)

**Account observed during walkthrough:** `Ron Perl` (vakokeg165@icotz.com) — a newly signed-up
developer account.

### Key finding: Developer = Agency (same portal, same features)

The developer account is **functionally identical** to the agency account. Every screen tested
was the same in structure and options:

| Area | Developer result vs Agency |
|---|---|
| Sidebar menu | Identical — Dashboard, Listing, Reports, Manage Profile, Billing, Pricing, Logout |
| Dashboard KPIs | Identical — Total Views, Enquiries, Phone Clicks, Total Share, Active/Featured Listings |
| Manage Profile | Identical sections — Personal Details, Company Details, Company Logo, **Developer Logo**, Social Reach |
| Pricing plans | Identical — $299 Developer & Agency, $399 Builders + the same 4 Featured Upgrades |
| Listing categories | Identical — New Apartments, Townhouses, Land & Estates, Commercial, Over 55's, House & Land |
| Billing | Identical — View & pay invoices |

**Conclusion:** "Developer" and "Agency" are effectively **one shared account type** in this portal.
This is confirmed by the base plan itself being named **"Developer AND Agency Listing" ($299/month)** —
both roles subscribe to the same plan and get the same tools. The only practical difference is the
**Developer Logo** upload slot in the profile (also present for agencies), intended for developers to
brand their projects. No developer-only screens, categories, pricing, or permissions were found.

> No draft listing was created on the Ron Perl account (stopped at the category-selection screen).

### ✅ VERIFIED IN ADMIN — Developer and Agency are the SAME account type

Confirmed from the **admin dashboard** (logged in as admin "Tim"), read-only:

- The admin has a **single user-management list called "All Agencies" / "ALL AGENCY"**. There is
  **no separate "Developers" list** in the admin menu.
- The developer account I signed up as (**Ron Perl**, vakokeg165@icotz.com, Org: **RonDev**) appears
  in that **same "ALL AGENCY" list** alongside every other account — no "type" column, no developer flag.
- Opening the account record (`agency_profile?user_id=138`) shows the **identical profile form** used
  for everyone (Personal Details, Company Details, Company Logo, **Developer Logo**, Social Reach).
  **There is no "account type: developer / agency" field anywhere.**

**Definitive answer:** In this system there is **no functional difference** between "developer" and
"agency." The choice made at sign-up is just a **label**; internally every listing account is stored
and managed as an **"Agency"** record with one identical feature set and price list. The only nod to
"developer" is the optional **Developer Logo** slot, so a listing can display the builder's brand next
to the agency's brand.

---

## USER TYPE 3 — Admin (superuser / back office)

**Account observed:** admin "Tim" (offtheplan.com.au/home renders as the admin console for this login).
This is a **separate, internal role** — not something a customer signs up for.

### Admin sidebar / capabilities

| Menu item | What the admin can do |
|---|---|
| **Dashboard** | Site-wide aggregate stats (Total Views 39,769 / Enquiries 569 / Phone Clicks 109 / Active Listings 44 / Featured Listings 10) **+ Property Alert Sign-Ups** table (buyer leads: name, email, phone, category, state, date) exportable to **PDF / Excel** |
| **Listing** | View/manage **all** listings across every account |
| **All Agencies** | The master account list. Per account: see active-listing count, **Email Verified** status, **Portal Status**, **Activate / Deactivate Portal**, **View Listings**, and open/edit the account's profile. Filter by name/email/org + email-verified. |
| **Reports** | Analytics across the platform |
| **Pricing** | Manage the pricing/plans shown on the site |
| **News and Events** | Manage the news/articles + events content |
| **Homepage Setup** | Configure the public homepage (featured projects, banners, etc.) |
| **Ads Management** | Manage ads/placements |

> Admin is a true superuser: it can activate/deactivate any customer's portal, see all leads, and
> control site content (homepage, news, ads, pricing). Regular Agency/Developer accounts have none of this.
> (Explored read-only — no accounts were activated/deactivated, no content changed.)

---

## Feature availability matrix

| Capability | Agency (Type 1) | Developer (Type 2) | Admin (Type 3) |
|---|---|---|---|
| Account type in system | Stored as "Agency" | Stored as "Agency" (same) | Internal superuser |
| Create / edit **own** listings | ✅ | ✅ (identical) | — (manages all) |
| Manage **all** listings/accounts | ❌ | ❌ | ✅ |
| Category access | Apartments, Townhouses, Land & Estates, Commercial, Over 55's (+ House & Land on Builders plan) | Same — all categories | n/a |
| Dashboard KPIs | Own stats | Own stats (identical) | Site-wide stats + buyer leads |
| Reports / analytics | Own | Own (identical) | Platform-wide |
| Manage public profile + logos + socials | ✅ | ✅ (identical) | Edits anyone's |
| View & pay invoices | ✅ | ✅ (identical) | — |
| Buy visibility upgrades | ✅ | ✅ (identical) | Sets pricing |
| Activate/deactivate portals | ❌ | ❌ | ✅ |
| Homepage / News / Ads control | ❌ | ❌ | ✅ |
| Base monthly cost | $299 (or $399 Builders) | Same $299 / $399 | n/a (internal) |

---

## Notes / to verify next

- Confirm the exact **credit-card form** location by publishing a listing (stopped before payment to avoid a real charge).
- ⚠️ **A draft listing `listing_id=182` (New Apartments) was created on the Mark Trent account** during this walkthrough. It is an unpublished draft (no payment taken) — delete it if not wanted.
- ✅ Developer type tested — identical to Agency (see User Type 2 section).
- Next: log in as any remaining role (e.g. buyer/consumer, admin) and fill in the Type 3 column above.
