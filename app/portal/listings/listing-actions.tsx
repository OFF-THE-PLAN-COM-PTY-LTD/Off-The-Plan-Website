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
  name: string;
  /** Mandatory fields (name + suburb + state) are filled, so the listing can be activated. */
  canActivate: boolean;
}

export function PortalListingActions({ id, slug, isPublished, isFeatured, status, name, canActivate }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveConfirmText, setArchiveConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleArchive() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "Archived" }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Could not archive listing.");
      setLoading(false);
      return;
    }
    setShowArchiveModal(false);
    setArchiveConfirmText("");
    router.refresh();
    setLoading(false);
  }

  const isDraft = !isPublished;

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {/* View Listing only makes sense once the listing is publicly reachable —
            drafts return 404 at /listings/<slug>, so the button was misleading. */}
        {isPublished && (
          <a
            href={`/listings/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1.5 border border-line text-ink/60 hover:border-navy hover:text-navy transition-colors whitespace-nowrap"
          >
            View Listing
          </a>
        )}
        <Link
          href={`/portal/listings/${id}/edit`}
          className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1.5 border border-orange text-orange hover:bg-orange hover:text-white transition-colors whitespace-nowrap"
        >
          Edit Listing
        </Link>

        {isPublished && !isFeatured && (
          <>
            <Link
              href="/portal/pricing"
              className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1.5 border border-line text-ink/60 hover:border-navy hover:text-navy transition-colors whitespace-nowrap"
            >
              Add Promo Flag
            </Link>
            <Link
              href="/portal/pricing"
              className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1.5 border border-orange/40 text-orange hover:bg-orange hover:text-white transition-colors whitespace-nowrap"
            >
              Feature This Listing
            </Link>
          </>
        )}

        {/* Activate = subscribe & publish this listing. Only for drafts that
            aren't archived; needs the mandatory fields filled first. */}
        {isDraft && status !== "Archived" && (
          canActivate ? (
            <a
              href={`/api/stripe/checkout?tier=agency_listing&project=${id}`}
              className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1.5 bg-orange text-white border border-orange hover:bg-orange/90 transition-colors whitespace-nowrap"
            >
              Activate
            </a>
          ) : (
            <span
              aria-disabled="true"
              title="Fill in Project Name, Suburb and State to activate"
              className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1.5 border border-line text-ink/30 cursor-not-allowed whitespace-nowrap"
            >
              Activate
            </span>
          )
        )}

        {isDraft && (
          <button
            onClick={() => { setArchiveConfirmText(""); setError(null); setShowArchiveModal(true); }}
            className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1.5 border border-line text-ink/60 hover:border-navy hover:text-navy transition-colors whitespace-nowrap"
          >
            Archive
          </button>
        )}
      </div>

      {/* Archive confirmation modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50">
          <div className="bg-white w-full max-w-md mx-4 p-6 flex flex-col gap-4">
            <h2 className="font-mono text-[13px] uppercase tracking-widest text-ink font-bold">
              Archive Listing
            </h2>
            <p className="font-sans text-sm text-ink/70">
              You are about to archive <strong>{name}</strong>. Archived listings stay in your
              portal but are removed from public view.
            </p>
            <p className="font-sans text-sm text-ink/70">
              Type <strong>archive</strong> below to confirm.
            </p>
            <input
              type="text"
              value={archiveConfirmText}
              onChange={(e) => setArchiveConfirmText(e.target.value)}
              placeholder="Type archive to confirm"
              autoFocus
              className="border border-line px-3 py-2 font-sans text-sm outline-none focus:border-navy w-full"
            />
            {error && <p className="font-sans text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleArchive}
                disabled={archiveConfirmText !== "archive" || loading}
                className="flex-1 font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 bg-navy text-white hover:bg-navy/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Archiving…" : "Archive Listing"}
              </button>
              <button
                onClick={() => { setShowArchiveModal(false); setArchiveConfirmText(""); setError(null); }}
                className="flex-1 font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 border border-line text-ink/60 hover:text-ink transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
