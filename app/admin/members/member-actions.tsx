"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
  status: string;
}

export function MemberActions({ id, status }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function update(newStatus: string) {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Save failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
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
            onClick={() => update("rejected")}
            disabled={submitting}
            className="font-mono text-[9px] uppercase tracking-widest border border-red-300 text-red-600 px-3 py-1.5 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Revoke
          </button>
        )}
        {status === "rejected" && (
          <button
            type="button"
            onClick={() => update("approved")}
            disabled={submitting}
            className="font-mono text-[9px] uppercase tracking-widest bg-green-700 text-white px-3 py-1.5 hover:bg-green-800 transition-colors disabled:opacity-50"
          >
            Approve
          </button>
        )}
      </div>
      {error && <p className="font-sans text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
