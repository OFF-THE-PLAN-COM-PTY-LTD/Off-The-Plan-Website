import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase/public";
import { listingPath } from "@/lib/listing-url";
import type { Development } from "@/types/development";

export const metadata: Metadata = {
  title: "Map View",
  description: "Browse off-the-plan listings across Australia on an interactive map.",
};

// Dynamic import — mapbox-gl is browser-only
const DevelopmentsMap = dynamic(
  () => import("@/components/developments-map").then((m) => m.DevelopmentsMap),
  { ssr: false, loading: () => <div className="flex-1 bg-gradient-to-br from-navy-deep to-navy-mid" /> }
);

interface Props {
  searchParams: { state?: string; type?: string };
}

export default async function MapPage({ searchParams }: Props) {
  let query = supabase
    .from("developments")
    .select("id, name, slug, suburb, state, type, price_display, status, lat, lng, beds_min, beds_max, completion_quarter")
    .eq("is_published", true)
    .not("lat", "is", null)
    .not("lng", "is", null);

  if (searchParams.state) query = query.eq("state", searchParams.state);
  if (searchParams.type) query = query.eq("type", searchParams.type);

  const { data } = await query;
  const developments = (data ?? []) as unknown as Development[];

  const hasToken = !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  return (
    <div className="fixed inset-0 top-16 flex">
      {/* Map area */}
      <div className="flex-1 relative">
        {hasToken ? (
          <DevelopmentsMap developments={developments} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-navy-deep to-navy-mid flex items-center justify-center">
            <div className="text-center px-6">
              <p className="font-display text-section-lg font-light text-ink-light/60 mb-2">Map coming soon</p>
              <p className="font-sans text-body-md text-ink-light/40 max-w-xs mx-auto mb-6">
                Add <code className="font-mono text-orange">NEXT_PUBLIC_MAPBOX_TOKEN</code> to enable the interactive map.
              </p>
              <Link href="/search" className="btn-ghost-dark inline-block">Switch to list view</Link>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-navy border-l border-white/10 overflow-y-auto">
        {/* Filters */}
        <div className="p-5 border-b border-white/10">
          <p className="font-mono text-label-sm uppercase tracking-widest text-ink-light/30 mb-3">Filter</p>
          <form method="GET" action="/map" className="flex flex-col gap-2">
            <select
              name="state"
              defaultValue={searchParams.state ?? ""}
              className="font-mono text-label-lg bg-white/5 border border-white/10 text-ink-light px-3 py-2 outline-none cursor-pointer"
            >
              <option value="" className="bg-navy">All states</option>
              {["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"].map((s) => (
                <option key={s} value={s} className="bg-navy">{s}</option>
              ))}
            </select>
            <select
              name="type"
              defaultValue={searchParams.type ?? ""}
              className="font-mono text-label-lg bg-white/5 border border-white/10 text-ink-light px-3 py-2 outline-none cursor-pointer"
            >
              <option value="" className="bg-navy">All types</option>
              {["New Apartments", "Townhouses", "Land and Estates", "Commercial", "Houses", "Over 55's / Retirement"].map((t) => (
                <option key={t} value={t} className="bg-navy">{t}</option>
              ))}
            </select>
            <button type="submit" className="btn-primary py-2">Apply</button>
          </form>
        </div>

        {/* Development list */}
        <div className="p-4 flex flex-col gap-1">
          <p className="font-mono text-label-sm uppercase tracking-widest text-ink-light/30 mb-2">
            {developments.length} listing{developments.length !== 1 ? "s" : ""}
          </p>
          {developments.map((dev) => (
            <Link
              key={dev.id}
              href={listingPath(dev)}
              className="flex items-start gap-3 p-3 hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 rounded"
            >
              <div className="mt-1.5 w-2 h-2 rounded-full bg-orange flex-shrink-0" />
              <div>
                <p className="font-display text-card-lg font-light text-ink-light leading-tight">{dev.name}</p>
                <p className="font-mono text-label-sm text-ink-light/40 uppercase tracking-widest">
                  {dev.suburb}, {dev.state}
                </p>
                {dev.price_display && (
                  <p className="font-mono text-label-sm text-orange mt-0.5">From {dev.price_display}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
