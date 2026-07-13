"use client";

import { getCardFields } from "@/lib/listing-card-fields";
import type { FloorPlan, ListingData } from "../types";

// Both delete-confirmation modals. Rendered OUTSIDE the <form> element by the
// orchestrator (same DOM position as before the split) so pressing Enter in
// the confirm inputs doesn't submit the listing form.

interface Props {
  type: string;
  existing?: ListingData;
  floorPlans: FloorPlan[];
  // Floor plan delete confirmation (portal only)
  pendingDeleteIndex: number | null;
  setPendingDeleteIndex: (i: number | null) => void;
  floorPlanDeleteText: string;
  setFloorPlanDeleteText: (v: string) => void;
  removeFloorPlan: (index: number) => void;
  // Listing delete confirmation
  showDeleteModal: boolean;
  setShowDeleteModal: (v: boolean) => void;
  deleteConfirmText: string;
  setDeleteConfirmText: (v: string) => void;
  handleDelete: () => Promise<void>;
}

export function DeleteModals({
  type,
  existing,
  floorPlans,
  pendingDeleteIndex,
  setPendingDeleteIndex,
  floorPlanDeleteText,
  setFloorPlanDeleteText,
  removeFloorPlan,
  showDeleteModal,
  setShowDeleteModal,
  deleteConfirmText,
  setDeleteConfirmText,
  handleDelete,
}: Props) {
  return (
    <>
      {/* ── Delete confirmation modal ─────────────────────────────────────── */}
      {/* Floor plan delete confirmation modal (portal only) */}
      {pendingDeleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50">
          <div className="bg-white w-full max-w-md mx-4 p-6 flex flex-col gap-4">
            <h2 className="font-mono text-[13px] uppercase tracking-widest text-ink font-bold">Delete Configuration</h2>
            <p className="font-sans text-sm text-ink/70">
              You are about to delete the configuration:{" "}
              <strong>
                {getCardFields(type)
                  .map((f) => {
                    const v = (floorPlans[pendingDeleteIndex] as unknown as Record<string, unknown>)?.[f.key];
                    return `${v == null || v === "" ? "—" : v} ${f.label}`;
                  })
                  .join(", ")}
                {floorPlans[pendingDeleteIndex]?.price_from ? `, $${Number(floorPlans[pendingDeleteIndex].price_from).toLocaleString()}` : ""}
              </strong>
              . This cannot be undone.
            </p>
            <p className="font-sans text-sm text-ink/70">Type <strong>delete</strong> below to confirm.</p>
            <input
              type="text"
              value={floorPlanDeleteText}
              onChange={(e) => setFloorPlanDeleteText(e.target.value)}
              placeholder="delete"
              autoFocus
              className="border border-line px-3 py-2 font-mono text-sm outline-none focus:border-red-400 w-full"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { removeFloorPlan(pendingDeleteIndex); setPendingDeleteIndex(null); setFloorPlanDeleteText(""); }}
                disabled={floorPlanDeleteText !== "delete"}
                className="flex-1 font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => { setPendingDeleteIndex(null); setFloorPlanDeleteText(""); }}
                className="flex-1 font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 border border-line text-ink/60 hover:text-ink transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50">
          <div className="bg-white w-full max-w-md mx-4 p-6 flex flex-col gap-4">
            <h2 className="font-mono text-[13px] uppercase tracking-widest text-ink font-bold">Delete listing</h2>
            <p className="font-sans text-sm text-ink/70">
              This will permanently delete <strong>{existing?.name ?? "this listing"}</strong> and cannot be undone.
            </p>
            <p className="font-sans text-sm text-ink/70">
              Type <strong>delete</strong> below to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="delete"
              className="border border-line px-3 py-2 font-mono text-sm outline-none focus:border-ink"
              autoFocus
            />
            <div className="flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
                className="font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 border border-ink text-ink hover:bg-ink hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteConfirmText !== "delete"}
                className="font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 bg-ink text-white hover:bg-ink/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
