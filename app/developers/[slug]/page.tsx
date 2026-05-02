import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PropertyCard } from "@/components/property-card";
import { mockDevelopers, mockDevelopments } from "@/lib/mock-data";

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dev = mockDevelopers.find((d) => d.slug === params.slug);
  if (!dev) return { title: "Not Found" };
  return { title: `${dev.name} — Developer`, description: dev.description ?? undefined };
}

export default function DeveloperProfilePage({ params }: Props) {
  const dev = mockDevelopers.find((d) => d.slug === params.slug && d.is_published);
  if (!dev) notFound();

  const devDevelopments = mockDevelopments.filter((d) => d.developer_id === dev.id && d.is_published);

  return (
    <div className="min-h-screen bg-cream pt-16">
      <section className="bg-navy py-16">
        <div className="container-padded flex items-end gap-8">
          <div className="h-20 w-20 bg-white/10 flex items-center justify-center flex-shrink-0 flex-shrink-0">
            {dev.logo_url ? (
              <img src={dev.logo_url} alt={dev.name} className="h-14 object-contain" />
            ) : (
              <span className="font-display text-[28px] font-light text-ink-light/70 leading-none select-none">
                {dev.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
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

        <h2 className="font-display font-light text-navy text-section-lg mb-6">Current developments</h2>
        {devDevelopments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {devDevelopments.map((d) => <PropertyCard key={d.id} development={d} layout="tall" />)}
          </div>
        ) : (
          <p className="font-sans text-body-md text-ink/40">No published developments at this time.</p>
        )}
      </div>
    </div>
  );
}
