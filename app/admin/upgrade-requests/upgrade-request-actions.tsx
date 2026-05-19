"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
  status: string;
  notes: string;
}

export function UpgradeRequestActions({ id, status, notes }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draftNotes, setDraftNotes] = useState(notes);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function update(newStatus: string) {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/upgrade-request", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus, admin_notes: draftNotes }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Save failed");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        {status === "pending" && (
          <>
            <button
              type="button"
              onClick={() => update("approved")}
              disabled={submitting}
              className="font-mono text-[9px] uppercase tracking-widest bg-green-700 text-white px-3 py-1.5 hover:bg-green-800 transition-colors disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => update("rejected")}
              disabled={submitting}
              className="font-mono text-[9px] uppercase tracking-widest bg-red-700 text-white px-3 py-1.5 hover:bg-red-800 transition-colors disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}
        {status === "approved" && (
          <button
            type="button"
            onClick={() => update("completed")}
            disabled={submitting}
            className="font-mono text-[9px] uppercase tracking-widest bg-navy text-white px-3 py-1.5 hover:bg-navy/80 transition-colors disabled:opacity-50"
          >
            Mark Complete
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="font-mono text-[9px] uppercase tracking-widest border border-ink/30 text-ink/60 px-3 py-1.5 hover:border-ink hover:text-ink transition-colors"
        >
          {open ? "Close" : "Notes"}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-2 bg-cream/50 border border-line p-3">
          <textarea
            value={draftNotes}
            onChange={(e) => setDraftNotes(e.target.value)}
            placeholder="Internal admin notes (visible to admins only)..."
            rows={3}
            className="font-sans text-[12px] bg-white border border-line px-2 py-1.5 outline-none focus:border-orange/60 resize-none"
          />
          <div className="flex items-center justify-between gap-2">
            {error && (
              <p className="font-sans text-[11px] text-red-600 flex-1">{error}</p>
            )}
            <button
              type="button"
              onClick={() => update(status)}
              disabled={submitting}
              className="font-mono text-[9px] uppercase tracking-widest bg-ink text-white px-3 py-1.5 hover:bg-ink/80 transition-colors disabled:opacity-50 ml-auto"
            >
              {submitting ? "Saving…" : "Save Notes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
