import type { Metadata } from "next";
import Link from "next/link";
import { PropertyCard } from "@/components/property-card";

export const metadata: Metadata = { title: "Saved Developments" };

// Auth is handled by middleware — user is always authenticated here
export default function SavedPage() {
  // Swap for real Supabase query when connected
  const saved: never[] = [];

  return (
    <div className="min-h-screen bg-cream pt-16">
      <div className="container-padded py-14">
        <h1 className="font-display font-light text-navy text-section-xl mb-10">Saved</h1>
        {saved.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* PropertyCard items rendered here */}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="font-display font-light text-navy/30 text-section-lg mb-3">Nothing saved yet</p>
            <p className="font-sans text-body-md text-ink/50 mb-6">Heart any development to save it here.</p>
            <Link href="/search" className="btn-primary inline-block">Browse developments</Link>
          </div>
        )}
      </div>
    </div>
  );
}
