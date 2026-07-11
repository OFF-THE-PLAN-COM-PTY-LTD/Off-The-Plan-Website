import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase/public";
import type { Developer } from "@/types/developer";

// Render on every request so admin changes (publishing a developer, syncing
// a Developer-agency, unpublishing one) show up immediately instead of being
// frozen into a static build. Matches the homepage convention (app/page.tsx).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Developers",
  description: "Browse residential developers listing off-the-plan properties across Australia.",
};

export default async function DevelopersPage() {

  // Tim's PDF feedback I15: show only real developer-company entries on
  // /developers (filter out anything that's actually a project name). The
  // migrated rows in `developers` are all genuine developer companies, so
  // we show every published row here — admin's "Published" toggle is the
  // single source of truth, and the public page mirrors it exactly. If a
  // wrong-name row ever appears, Tim can hide it from /admin/developers.
  const [{ data: devsData }, { data: devsDevsData }] = await Promise.all([
    supabase.from("developers").select("*").eq("is_published", true).order("name"),
    // agency_id lets us count listings for directory rows synced from a
    // Developer-agency (migration 045) — their listings link via agency_id,
    // not developer_id — so those cards show a real count instead of 0.
    supabase.from("developments").select("id, developer_id, agency_id").eq("is_published", true),
  ]);

  const developers = (devsData ?? []) as unknown as Developer[];
  const allDevelopments = devsDevsData ?? [];

  return (
    <div className="min-h-screen bg-cream pt-16">
      <section className="bg-navy py-16">
        <div className="container-padded">
          <p className="section-label text-ink-light/30 mb-3">Developer directory</p>
          <h1 className="font-display font-light text-ink-light text-section-xl">The developers behind the projects.</h1>
        </div>
      </section>

      <div className="container-padded py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {developers.map((dev) => {
            const devCount = allDevelopments.filter(
              (d) =>
                d.developer_id === dev.id ||
                (dev.agency_id != null && d.agency_id === dev.agency_id),
            ).length;
            const initials = dev.name
              .split(/\s+/)
              .map((w) => w[0])
              .filter(Boolean)
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <Link
                key={dev.id}
                href={`/developers/${dev.slug}`}
                className="group p-6 border border-line bg-cream-alt hover:border-orange transition-colors flex flex-col h-full"
              >
                {/* Logo slot — fixed container, logo capped at 80% width / 80% height
                    so wide banners and tall squares both look proportional next to
                    each other in the grid. Falls back to a small navy monogram
                    rather than a giant name, so tiles with and without logos share
                    the same visual rhythm. */}
                <div className="h-16 flex items-center justify-center mb-4 bg-white border border-line">
                  {dev.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={dev.logo_url}
                      alt={dev.name}
                      className="max-h-[80%] max-w-[80%] object-contain"
                    />
                  ) : (
                    <span className="font-mono text-[14px] font-bold uppercase tracking-widest text-navy group-hover:text-orange transition-colors">
                      {initials || "—"}
                    </span>
                  )}
                </div>
                <p className="font-sans text-sm font-semibold text-navy mb-1">{dev.name}</p>
                <p className="font-sans text-body-md text-ink/60 line-clamp-2 mb-3 min-h-[3em]">
                  {dev.description ?? <span className="text-ink/20 italic">No description yet.</span>}
                </p>
                <p className="font-mono text-label-sm uppercase tracking-widest text-ink/30 mt-auto">
                  {devCount} active listing{devCount !== 1 ? "s" : ""}
                  {dev.state && <> · {dev.state}</>}
                </p>
              </Link>
            );
          })}
        </div>

        <div className="mt-14 pt-10 border-t border-line text-center">
          <p className="font-display font-light text-navy text-section-lg mb-4">List your listing</p>
          <p className="font-sans text-body-md text-ink/60 mb-6 max-w-md mx-auto">
            Reach qualified buyers before your listing reaches the general market.
          </p>
          <Link href="/list-a-listing" className="btn-primary inline-block">
            List Now
          </Link>
        </div>
      </div>
    </div>
  );
}
