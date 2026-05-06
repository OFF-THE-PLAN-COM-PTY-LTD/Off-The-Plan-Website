"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  id: string;
  slug: string;
  isPublished: boolean;
  isFeatured: boolean;
  status: string | null;
}

export function PortalListingActions({ id, slug, isPublished, isFeatured, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function togglePublish(value: boolean) {
    setLoading(true);
    await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_published: value }),
    });
    router.refresh();
    setLoading(false);
  }

  const isDraft = !isPublished;

  return (
    <div className="flex flex-wrap gap-1.5">
      <a
        href={`/listings/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1.5 border border-line text-ink/60 hover:border-navy hover:text-navy transition-colors whitespace-nowrap"
      >
        View Listing
      </a>
      <Link
        href={`/admin/listings/${id}`}
        className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1.5 border border-orange text-orange hover:bg-orange hover:text-white transition-colors whitespace-nowrap"
      >
        Edit Listing
      </Link>

      {isPublished && (
        <>
          <Link
            href="/portal/pricing"
            className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1.5 border border-line text-ink/60 hover:border-navy hover:text-navy transition-colors whitespace-nowrap"
          >
            Add Promo Flag
          </Link>
          <button
            onClick={() => togglePublish(false)}
            disabled={loading}
            className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1.5 border border-red-300 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors whitespace-nowrap disabled:opacity-50"
          >
            {loading ? "…" : "Cancel Listing"}
          </button>
          {!isFeatured && (
            <Link
              href="/portal/pricing"
              className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1.5 border border-orange/40 text-orange hover:bg-orange hover:text-white transition-colors whitespace-nowrap"
            >
              Feature This Listing
            </Link>
          )}
        </>
      )}

      {isDraft && (
        <>
          <Link
            href="/contact"
            className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1.5 border border-line text-ink/60 hover:border-navy hover:text-navy transition-colors whitespace-nowrap"
          >
            Archive
          </Link>
          <Link
            href="/contact"
            className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1.5 border border-line text-ink/60 hover:border-navy hover:text-navy transition-colors whitespace-nowrap"
          >
            Clone
          </Link>
          <button
            onClick={() => togglePublish(true)}
            disabled={loading}
            className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1.5 bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap disabled:opacity-50"
          >
            {loading ? "…" : "Activate"}
          </button>
        </>
      )}
    </div>
  );
}
