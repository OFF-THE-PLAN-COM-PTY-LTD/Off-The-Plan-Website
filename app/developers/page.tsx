import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase/public";
import type { Developer } from "@/types/developer";

export const metadata: Metadata = {
  title: "Developers",
  description: "Browse residential developers listing off-the-plan properties across Australia.",
};

export default async function DevelopersPage() {

  const [{ data: devsData }, { data: devsDevsData }] = await Promise.all([
    supabase.from("developers").select("*").eq("is_published", true).order("name"),
    supabase.from("developments").select("id, developer_id").eq("is_published", true),
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
            const devCount = allDevelopments.filter((d) => d.developer_id === dev.id).length;
            return (
              <Link
                key={dev.id}
                href={`/developers/${dev.slug}`}
                className="group p-6 border border-line bg-cream-alt hover:border-orange transition-colors"
              >
                <div className="h-16 flex items-center mb-4">
                  {dev.logo_url ? (
                    <img src={dev.logo_url} alt={dev.name} className="h-full object-contain" />
                  ) : (
                    <span className="font-display text-card-xl font-light text-navy group-hover:text-orange transition-colors">{dev.name}</span>
                  )}
                </div>
                <p className="font-sans text-body-md text-ink/60 line-clamp-2 mb-3">{dev.description}</p>
                <p className="font-mono text-label-sm uppercase tracking-widest text-ink/30">
                  {devCount} active development{devCount !== 1 ? "s" : ""} · {dev.state}
                </p>
              </Link>
            );
          })}
        </div>

        <div className="mt-14 pt-10 border-t border-line text-center">
          <p className="font-display font-light text-navy text-section-lg mb-4">List your development</p>
          <p className="font-sans text-body-md text-ink/60 mb-6 max-w-md mx-auto">
            Reach 24,000+ qualified buyers before your development reaches the general market.
          </p>
          <Link href="/list-a-development" className="btn-primary inline-block">
            Get in touch
          </Link>
        </div>
      </div>
    </div>
  );
}
