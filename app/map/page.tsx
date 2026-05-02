import type { Metadata } from "next";
import Link from "next/link";
import { mockDevelopments } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Map View",
  description: "Browse off-the-plan developments across Australia on an interactive map.",
};

export default function MapPage() {
  const developments = mockDevelopments.filter((d) => d.is_published && d.lat && d.lng);

  return (
    <div className="fixed inset-0 top-16 bg-navy flex">
      {/* Map placeholder — replace with Mapbox GL JS when token is available */}
      <div className="flex-1 relative flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-deep to-navy-mid" />
        <div className="relative z-10 text-center">
          <p className="font-mono text-label-lg uppercase tracking-widest text-ink-light/40 mb-3">
            Map View
          </p>
          <p className="font-display text-section-lg font-light text-ink-light/60 mb-2">
            Mapbox integration pending
          </p>
          <p className="font-sans text-body-md text-ink-light/40 max-w-xs mx-auto mb-6">
            Add your <code className="font-mono text-orange">NEXT_PUBLIC_MAPBOX_TOKEN</code> to
            .env.local to activate the interactive map.
          </p>
          <Link href="/search" className="btn-ghost-dark inline-block">
            Switch to list view
          </Link>
        </div>

        {/* Pin indicators */}
        {developments.map((dev) => (
          <div
            key={dev.id}
            className="absolute"
            style={{
              left: `${((dev.lng! + 115) / 55) * 100}%`,
              top: `${((dev.lat! + 44) / 22) * 100}%`,
            }}
            title={dev.name}
          >
            <div className="w-3 h-3 rounded-full bg-orange border-2 border-white shadow-lg" />
          </div>
        ))}
      </div>

      {/* Filter sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-navy-mid border-l border-line-dark overflow-y-auto">
        <div className="p-5 border-b border-line-dark">
          <p className="font-mono text-label-lg uppercase tracking-widest text-ink-light/40 mb-3">
            Filters
          </p>
          <form method="GET" action="/map" className="flex flex-col gap-2">
            <select
              name="state"
              className="font-mono text-label-lg bg-white/5 border border-line-dark text-ink-light px-3 py-2 outline-none cursor-pointer"
              aria-label="State"
            >
              <option value="" className="bg-navy">All states</option>
              {["VIC", "NSW", "QLD", "WA", "SA"].map((s) => (
                <option key={s} value={s} className="bg-navy">{s}</option>
              ))}
            </select>
            <select
              name="type"
              className="font-mono text-label-lg bg-white/5 border border-line-dark text-ink-light px-3 py-2 outline-none cursor-pointer"
              aria-label="Type"
            >
              <option value="" className="bg-navy">All types</option>
              {["Apartments", "Townhouses", "Houses", "Penthouses"].map((t) => (
                <option key={t} value={t} className="bg-navy">{t}</option>
              ))}
            </select>
            <button type="submit" className="btn-primary py-2">Apply</button>
          </form>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {developments.map((dev) => (
            <Link
              key={dev.id}
              href={`/developments/${dev.slug}`}
              className="flex items-start gap-3 p-3 hover:bg-white/5 transition-colors border border-transparent hover:border-line-dark"
            >
              <div className="mt-1 w-2 h-2 rounded-full bg-orange flex-shrink-0" />
              <div>
                <p className="font-display text-card-lg font-light text-ink-light">{dev.name}</p>
                <p className="font-mono text-label-sm text-ink-light/40 uppercase tracking-widest">
                  {dev.suburb}, {dev.state}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
