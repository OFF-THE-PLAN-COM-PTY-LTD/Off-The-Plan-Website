# Off The Plan

Off The Plan is Australia's curated off-the-plan real estate marketplace — connecting discerning buyers with premium apartment, townhouse, and house developments before they reach the broader market. The platform gives developers a polished channel to present projects, and gives buyers editorial-quality discovery, early access, and a direct line to sales specialists.

---

## Tech stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI components:** shadcn/ui primitives
- **Database:** Supabase (Postgres)
- **Auth:** Supabase Auth
- **Email:** Resend
- **Maps:** Mapbox GL JS
- **Package manager:** npm

---

## Prerequisites

- Node.js 18 or later
- npm 9 or later
- A Supabase project (see [Database setup](#database-setup))

---

## Local setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/Apex-AI-Clients/off-the-plan.git
   cd off-the-plan
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Open `.env.local` and fill in the values listed in the [Environment variables](#environment-variables) section below.

4. **Start the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL — found in Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key — safe to expose in the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — server-side only, never expose to the client |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox public access token — used for the map view |
| `RESEND_API_KEY` | Resend API key — used to send enquiry confirmation emails |

---

## Database setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com) and copy your project URL and keys into `.env.local`.

2. **Run migrations** in order using the Supabase SQL editor or the Supabase CLI:

   ```
   supabase/migrations/001_developers.sql
   supabase/migrations/002_developments.sql
   supabase/migrations/003_journal_articles.sql
   supabase/migrations/004_profiles.sql
   supabase/migrations/005_enquiries_leads.sql
   ```

3. **(Optional) Seed sample data**

   ```bash
   npx ts-node supabase/seed.ts
   ```

---

## Running tests

```bash
npm test
```

Tests live in `__tests__/` and cover API route logic. Run `npm run test:watch` for watch mode during development.

---

## Deployment

Deploy to the **company Vercel team account**. Do not deploy to personal Vercel accounts, Netlify, Replit, or any other host — this project handles real client and user data and must stay within company-controlled infrastructure.

If you do not have access to the company Vercel team account, contact the Roar Global AI team.

---

## Project structure

```
off-the-plan/
├── app/                  # Next.js App Router pages and API routes
├── components/           # Shared UI components
├── lib/                  # Utilities, Supabase clients, mock data
├── types/                # TypeScript types (Development, Journal, etc.)
├── supabase/             # Migrations and seed script
└── __tests__/            # API and utility tests
```
