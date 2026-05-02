import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PropertyCard } from "@/components/property-card";
import type { Development } from "@/types/development";

export const metadata: Metadata = { title: "Saved Developments" };

export default async function SavedPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("saved_developments")
    .select("development_id, saved_at, development:developments(*, developer:developers(*), images:development_images(*))")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false });

  const saved = ((data ?? []).map((row: any) => row.development).filter(Boolean)) as unknown as Development[];

  return (
    <div className="min-h-screen bg-cream pt-16">
      <div className="container-padded py-14">
        <div className="flex items-baseline gap-4 mb-10">
          <h1 className="font-display font-light text-navy text-section-xl">Saved</h1>
          {saved.length > 0 && (
            <p className="font-mono text-label-sm text-ink/30 uppercase tracking-widest">{saved.length} development{saved.length !== 1 ? "s" : ""}</p>
          )}
        </div>
        {saved.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {saved.map((d) => (
              <PropertyCard key={d.id} development={d} layout="tall" />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="font-display font-light text-navy/30 text-section-lg mb-3">Nothing saved yet</p>
            <p className="font-sans text-body-md text-ink/50 mb-6">Browse developments and save the ones you like.</p>
            <Link href="/search" className="btn-primary inline-block">Browse developments</Link>
          </div>
        )}
      </div>
    </div>
  );
}
