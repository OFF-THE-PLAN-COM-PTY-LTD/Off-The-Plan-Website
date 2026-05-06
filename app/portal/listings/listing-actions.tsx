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
}

export function PortalListingActions({ id, slug, isPublished, isFeatured, status, name }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelConfirmText, setCancelConfirmText] = useState("");

  async function handleCancel() {
    setLoading(true);
    await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_published: false }),
    });
    setShowCancelModal(false);
    setCancelConfirmText("");
    router.refresh();
    setLoading(false);
  }

  async function handleActivate() {
    setLoading(true);
    await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_published: true }),
    });
    router.refresh();
    setLoading(false);
  }

  const isDraft = !isPublished;

  return (
    <>
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
            <button
              onClick={() => { setCancelConfirmText(""); setShowCancelModal(true); }}
              className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1.5 border border-red-300 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors whitespace-nowrap"
            >
              Cancel Listing
            </button>
            <Link
              href="/portal/pricing"
              className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1.5 border border-orange/40 text-orange hover:bg-orange hover:text-white transition-colors whitespace-nowrap"
            >
              Feature This Listing
            </Link>
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
              onClick={handleActivate}
              disabled={loading}
              className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1.5 bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap disabled:opacity-50"
            >
              {loading ? "…" : "Activate"}
            </button>
          </>
        )}
      </div>

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50">
          <div className="bg-white w-full max-w-md mx-4 p-6 flex flex-col gap-4">
            <h2 className="font-mono text-[13px] uppercase tracking-widest text-ink font-bold">
              Cancel Listing
            </h2>
            <p className="font-sans text-sm text-ink/70">
              You are about to cancel <strong>{name}</strong>. This will unpublish the listing and remove it from the public site.
            </p>
            <p className="font-sans text-sm text-ink/70">
              Type <strong>cancel</strong> below to confirm.
            </p>
            <input
              type="text"
              value={cancelConfirmText}
              onChange={(e) => setCancelConfirmText(e.target.value)}
              placeholder="Type cancel to confirm"
              autoFocus
              className="border border-line px-3 py-2 font-sans text-sm outline-none focus:border-red-400 w-full"
            />
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={cancelConfirmText !== "cancel" || loading}
                className="flex-1 font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Cancelling…" : "Cancel Listing"}
              </button>
              <button
                onClick={() => { setShowCancelModal(false); setCancelConfirmText(""); }}
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
