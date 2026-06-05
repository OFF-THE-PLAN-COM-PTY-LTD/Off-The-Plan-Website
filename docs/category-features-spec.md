# Category-specific Property Features — extracted from existing live admin

Source: offtheplan.com.au/listing_detail?listing_id=<id> (logged in as Tim, 2026-06-04)

The existing live admin uses a single listing edit form, but the
"Property Features" checkbox list changes based on the `Category` dropdown.
All other sections (Project Overview, Configuration Summary, Pricing,
Selling Agents, Uploads, SEO) stay the same across categories.

This is the gap Ellie flagged — Commercial / Land & Estates listings in
our Vercel build currently render the residential feature list, which
makes no sense for those categories.

## Shared field set (rendered for every category)

These render regardless of which category is selected:

**Project Overview**
- Project Name (req)
- Listing Duration
- Project By
- Developer Website URL
- Number of Apartments/offices/lots
- Project Logo (file)

**Address (×2 — main + sale office)**
- Street address, Street 2, Country, State, City, Postcode

**Configuration Summary**
- Configuration (max 25)
- Bedroom Range / Floor Plan rows

**Description**
- Location Description
- Brief Description (req)
- Suburb / State (display)

**Display Suite**
- Display Suite Timing (req)

**Pricing**
- Search price minimum (req)
- list_price_maximum
- Lead In Pricing
- Display price on search results (checkbox)
- Promotional Banner

**Open Dates**
- Completion Date (req)

**Selling Agents (×2 slots)**
- name, email, mobile, photo file

**Uploads**
- Main Photo + Alt Text
- Up to 20 gallery images
- Video Link
- Selling Agent's Logo (×2)
- Floor plans upload
- Additional Video Link
- Price List, Brochure, Specifications (files)

**SEO**
- Page Title
- Meta Description

## Property Features — varies by category

### New Apartments (43 checkboxes)

Residential amenity-focused.

- Bar area
- BBQ Facilities
- Bike share
- Bin Chute
- Book Retreat and Library
- Building manager / Concierge
- Business center
- Cabanas
- Car share
- City views
- Co working options
- Consultation Room
- Delivery Room
- Dining room(s)
- EV charging capability
- Fireplaces
- Flowing, Light-Filled Layouts
- Fully Equipped Gym
- Guest apartment
- Jacuzzi/Spa(s)
- Kids Play Area
- Lounge and Casual dining
- Lush Residents' Pool
- Massage Room
- Music Room
- Outdoor fireplace
- Outdoor Gym
- Outdoor Theatre
- Premium Appliances Throughout
- Private Gardens & Terraces
- Putting Green
- Rooftop Garden
- Sauna and Steam Rooms
- Sculptural Architecture
- Sky Deck
- Swimming Pool(s)
- Tennis Courts
- Teppanyaki Grill
- Theatre
- Waterfront
- Wine Cellar
- Winter Garden
- Yoga Studio

### Commercial (19 checkboxes)

Business / industrial-focused.

- Air conditioned
- Car parking
- CCTV security camera
- Close to Transport
- Designated signage panels
- Efficient Lighting
- End of trip facilities
- Grease trap
- Green star energy ratings
- High ceilings
- High Profile location
- Internal fit out inclusions
- Kitchen facility
- Landscaping
- Low outgoings
- NBN connection
- Secure access
- Shop Front
- Staff Facilities

### Townhouses (TBD — needs scrape from live admin)

Likely a subset of the New Apartments residential features.

### House & Land (TBD — needs scrape from live admin)

Probably emphasises land + finishes — distinct from apartments.

### Land and Estates (TBD — needs scrape from live admin)

Probably the lightest feature set — land-only listings have fewer
amenity-style features and more land-spec ones.

### New Home Design (TBD — needs scrape from live admin)

Builder-package focused — probably mirrors House & Land.

### Over 55's / Retirement (TBD — needs scrape from live admin)

Likely an amenity set tilted toward accessibility / community
(elevators, dining room, healthcare proximity, etc.).

## Implementation plan for our Vercel build

1. Add a Postgres enum or `category_features` lookup table that maps
   category name → list of available feature labels.
2. In the listing form (`app/admin/listings/[id]/listing-form.tsx`),
   render the Property Features checkbox section dynamically based on
   the currently-selected `type`.
3. When `type` changes, prune any saved features that no longer belong
   to the new category (or keep them as legacy with a warning).
4. The public listing page already renders whatever features are set,
   so no change needed on the consumer side.

Once Tim's category fields doc arrives, validate this scraped spec
against it. The labels should match closely or be identical.
