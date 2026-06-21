import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PropertyCard } from "@/components/property-card";
import { supabase } from "@/lib/supabase/public";
import type { Developer } from "@/types/developer";
import type { Development } from "@/types/development";

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: dev } = await supabase
    .from("developers")
    .select("name, description")
    .eq("slug", params.slug)
    .single();
  if (!dev) return { title: "Not Found" };
  return { title: `${dev.name} — Developer`, description: dev.description ?? undefined };
}

export default async function DeveloperProfilePage({ params }: Props) {

  const { data: rawDev } = await supabase
    .from("developers")
    .select("*")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .single();

  if (!rawDev) notFound();
  const dev = rawDev as unknown as Developer;

  const { data: devsData } = await supabase
    .from("developments")
    .select("*, developer:developers(*), images:development_images(*), floor_plans:development_floor_plans(*)")
    .eq("developer_id", rawDev.id)
    .eq("is_published", true);

  const devDevelopments = (devsData ?? []) as unknown as Development[];

  return (
    <div className="min-h-screen bg-cream pt-16">
      <section className="bg-navy py-16">
        <div className="container-padded flex items-center gap-8 flex-wrap">
          {/* Logo card — fixed 160×80 white card with logo capped at 80% so
              all developer hero blocks look the same regardless of whether
              the source logo is wide, tall, or square. Falls back to a navy
              monogram so missing-logo pages don't look out-of-place. */}
          <div className="h-20 w-40 bg-white flex items-center justify-center flex-shrink-0">
            {dev.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dev.logo_url}
                alt={dev.name}
                className="max-h-[80%] max-w-[80%] object-contain"
              />
            ) : (
              <span className="font-mono text-[18px] font-bold uppercase tracking-widest text-navy select-none">
                {dev.name.split(/\s+/).map((w) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="font-display font-light text-ink-light text-section-xl">{dev.name}</h1>
            {dev.abn && <p className="font-mono text-label-sm text-ink-light/30 uppercase tracking-widest mt-1">ABN {dev.abn}</p>}
          </div>
        </div>
      </section>

      <div className="container-padded py-14">
        {dev.description && (
          <p className="font-sans text-body-lg text-ink/70 max-w-2xl mb-12">{dev.description}</p>
        )}

        <h2 className="font-display font-light text-navy text-section-lg mb-6">Current listings</h2>
        {devDevelopments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {devDevelopments.map((d) => <PropertyCard key={d.id} development={d} layout="tall" />)}
          </div>
        ) : (
          <p className="font-sans text-body-md text-ink/40">No published listings at this time.</p>
        )}
      </div>
    </div>
  );
}
