"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

type AgencyOption = { id: string; label: string };

interface Props {
  id: string;
  slug: string;
  /** Canonical category slug for the public listing URL (e.g. "apartments"). */
  category: string;
  isPublished: boolean;
  isFeatured: boolean;
  tier: string | null;
  agencyId: string | null;
  orgName: string | null;
  listingName: string;
  agencies: AgencyOption[];
}

export function ListingRowActions({ id, slug, category, isPublished, isFeatured, tier, agencyId, orgName, listingName, agencies }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tierValue, setTierValue] = useState(tier ?? "");
  const [showMove, setShowMove] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState(agencyId ?? "");
  const [agencySearch, setAgencySearch] = useState("");
  const [moving, setMoving] = useState(false);
  const [showInactivate, setShowInactivate] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  // Reflect the server tier after a router.refresh() / table re-render. The row
  // instance is reused (keyed by listing id), so the initializer above runs once
  // and the dropdown would otherwise keep a stale tier. Optimistic edits already
  // set tierValue before refresh, so the incoming prop matches and won't flicker.
  useEffect(() => {
    setTierValue(tier ?? "");
  }, [tier]);

  async function patch(fields: Record<string, unknown>) {
    setLoading(true);
    await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...fields }),
    });
    router.refresh();
    setLoading(false);
  }

  async function handleTierChange(value: string) {
    setTierValue(value);
    await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, tier: value || null }),
    });
    router.refresh();
  }

  async function handleMove() {
    if (!selectedAgency) return;
    setMoving(true);
    await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, agency_id: selectedAgency }),
    });
    setMoving(false);
    setShowMove(false);
    router.refresh();
  }

  const filteredAgencies = agencies.filter(a =>
    a.label.toLowerCase().includes(agencySearch.toLowerCase())
  );

  const currentAgencyLabel = agencies.find(a => a.id === agencyId)?.label ?? orgName ?? "—";

  return (
    <>
      <div className="flex flex-col gap-1.5 min-w-[220px]">
        {/* Tier dropdown */}
        <select
          value={tierValue}
          onChange={(e) => handleTierChange(e.target.value)}
          className="border border-line px-2 py-1.5 bg-white font-sans text-xs text-ink outline-none cursor-pointer focus:border-orange/60 w-full"
        >
          <option value="">— No tier —</option>
          <option value="1st Tier">1st Tier</option>
          <option value="2nd Tier">2nd Tier</option>
        </select>

        {/* Row 1: Move + View + Edit */}
        <div className="flex gap-1.5">
          <button
            onClick={() => { setShowMove(true); setAgencySearch(""); setSelectedAgency(agencyId ?? ""); }}
            className="font-mono text-[10px] uppercase tracking-widest px-2 py-1.5 border border-black bg-black text-white hover:bg-ink/80 transition-colors whitespace-nowrap"
          >
            Move
          </button>
          <a
            href={`/${category}/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center font-mono text-[10px] uppercase tracking-widest px-2 py-1.5 border border-line text-ink hover:border-navy hover:text-navy transition-colors whitespace-nowrap"
          >
            View Listing
          </a>
          <Link
            href={`/admin/listings/${id}`}
            className="flex-1 text-center font-mono text-[10px] uppercase tracking-widest px-2 py-1.5 border border-orange text-orange hover:bg-orange hover:text-white transition-colors whitespace-nowrap"
          >
            Edit Listing
          </Link>
        </div>

        {/* Row 2: Inactivate + Feature */}
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              if (isPublished) {
                setConfirmText("");
                setShowInactivate(true);
              } else {
                patch({ is_published: true });
              }
            }}
            disabled={loading}
            className={`flex-1 font-mono text-[10px] uppercase tracking-widest px-2 py-1.5 border transition-colors disabled:opacity-50 ${
              isPublished
                ? "border-red-400 text-red-700 hover:bg-red-500 hover:text-white hover:border-red-500"
                : "border-green-400 text-green-800 hover:bg-green-500 hover:text-white hover:border-green-500"
            }`}
          >
            {loading ? "…" : isPublished ? "Inactivate" : "Activate"}
          </button>
          {isPublished && (
            <button
              onClick={() => patch({ is_featured: !isFeatured })}
              disabled={loading}
              className="flex-1 font-mono text-[10px] uppercase tracking-widest px-2 py-1.5 border border-orange/60 text-orange hover:bg-orange hover:text-white transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isFeatured ? "Unfeature" : "Feature This Listing"}
            </button>
          )}
        </div>
      </div>

      {/* Move modal */}
      {showMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-line w-full max-w-2xl p-8 shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-sans font-semibold text-navy text-lg">Move Listing To New Agency/Developer</h2>
              <button onClick={() => setShowMove(false)} className="text-ink/40 hover:text-ink text-2xl leading-none">×</button>
            </div>

            <div className="mb-5 border-b border-line pb-5">
              <p className="font-sans text-sm font-semibold text-ink mb-1">Current Listing:</p>
              <p className="font-sans text-sm text-ink/70">Project name: <span className="font-semibold text-ink">{listingName}</span></p>
              <p className="font-sans text-sm text-ink/70">By (Org name): <span className="font-semibold text-ink">{currentAgencyLabel}</span></p>
            </div>

            <p className="font-sans text-sm text-orange mb-4">
              Select Agency/Developer below to move this listing to a new Agency/Developer.
            </p>

            <div className="flex items-center justify-between mb-1.5">
              <p className="font-sans text-xs text-ink/50 uppercase tracking-wider">Agency/Developer:</p>
              <p className="font-sans text-xs text-ink/40">{filteredAgencies.length} active</p>
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={agencySearch}
              onChange={e => setAgencySearch(e.target.value)}
              className="w-full border border-line px-3 py-2.5 text-sm font-sans text-ink focus:outline-none focus:border-navy mb-2"
            />
            <select
              size={12}
              value={selectedAgency}
              onChange={e => setSelectedAgency(e.target.value)}
              className="w-full border border-line text-sm font-sans text-ink focus:outline-none focus:border-navy mb-5 [&>option]:px-2 [&>option]:py-1.5"
            >
              {filteredAgencies.length === 0 ? (
                <option disabled>No active agencies/developers found</option>
              ) : (
                filteredAgencies.map(a => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))
              )}
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowMove(false)}
                className="font-sans text-sm px-4 py-2 border border-line text-ink/60 hover:bg-cream-alt transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMove}
                disabled={!selectedAgency || moving}
                className="font-sans text-sm px-4 py-2 bg-black text-white font-semibold disabled:opacity-40 hover:bg-ink/80 transition-colors"
              >
                {moving ? "Moving..." : "Move Listing"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inactivate confirmation modal */}
      {showInactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-line w-full max-w-md p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-sans font-semibold text-navy text-base">Inactivate Listing</h2>
              <button
                onClick={() => setShowInactivate(false)}
                className="text-ink/40 hover:text-ink text-lg leading-none"
              >
                ×
              </button>
            </div>

            <p className="font-sans text-sm text-ink mb-2">
              You&apos;re about to inactivate{" "}
              <span className="font-semibold text-navy">{listingName}</span>. It
              will be hidden from the public site immediately.
            </p>
            <p className="font-sans text-sm text-ink/60 mb-4">
              Type <span className="font-mono font-semibold text-red-700">INACTIVATE</span>{" "}
              below to confirm.
            </p>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type INACTIVATE"
              autoFocus
              className="w-full border border-line px-3 py-2 text-sm font-sans text-ink focus:outline-none focus:border-red-500 mb-4"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowInactivate(false)}
                className="font-sans text-sm px-4 py-2 border border-line text-ink/60 hover:bg-cream-alt transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowInactivate(false);
                  await patch({ is_published: false });
                }}
                disabled={confirmText !== "INACTIVATE" || loading}
                className="font-sans text-sm px-4 py-2 bg-black text-white font-semibold disabled:opacity-40 hover:bg-ink/80 transition-colors"
              >
                {loading ? "Inactivating..." : "Inactivate Listing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
