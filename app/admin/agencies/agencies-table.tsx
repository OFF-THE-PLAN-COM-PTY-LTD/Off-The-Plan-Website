"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Agency = {
  id: string;
  name: string | null;
  email: string | null;
  org_name: string | null;
  mobile: string | null;
  total_active_listings: number;
  email_verified: boolean;
  portal_status: "active" | "inactive";
};

type EmailFilter = "all" | "verified" | "unverified";

export default function AgenciesTable({ agencies }: { agencies: Agency[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [emailFilter, setEmailFilter] = useState<EmailFilter>("all");

  // Confirm modal state
  const [modal, setModal] = useState<{ agency: Agency; action: "deactivate" | "activate" } | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = agencies.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (a.name ?? "").toLowerCase().includes(q) ||
      (a.email ?? "").toLowerCase().includes(q) ||
      (a.org_name ?? "").toLowerCase().includes(q);
    const matchesEmail =
      emailFilter === "all" ||
      (emailFilter === "verified" && a.email_verified) ||
      (emailFilter === "unverified" && !a.email_verified);
    return matchesSearch && matchesEmail;
  });

  function openModal(agency: Agency) {
    setModal({ agency, action: agency.portal_status === "active" ? "deactivate" : "activate" });
    setConfirmText("");
  }

  function closeModal() {
    setModal(null);
    setConfirmText("");
  }

  async function handleConfirm() {
    if (!modal) return;
    const expected = modal.action === "deactivate" ? "DEACTIVATE" : "ACTIVATE";
    if (confirmText !== expected) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/agencies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: modal.agency.id,
          portal_status: modal.action === "deactivate" ? "inactive" : "active",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      closeModal();
      startTransition(() => router.refresh());
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const expected = modal?.action === "deactivate" ? "DEACTIVATE" : "ACTIVATE";

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Filter by Name / Email / Organisation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-line px-3 py-2 text-sm font-sans text-ink w-80 focus:outline-none focus:border-navy"
        />
        <div className="flex items-center gap-3 text-sm font-sans text-ink/60">
          <span>Email Verified?</span>
          {(["all", "verified", "unverified"] as const).map((v) => (
            <label key={v} className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="emailFilter"
                checked={emailFilter === v}
                onChange={() => setEmailFilter(v)}
                className="accent-navy"
              />
              <span className="capitalize">{v === "all" ? "All" : v === "verified" ? "Yes" : "No"}</span>
            </label>
          ))}
        </div>
        {(search || emailFilter !== "all") && (
          <button
            onClick={() => { setSearch(""); setEmailFilter("all"); }}
            className="text-sm font-sans text-blue-600 underline"
          >
            Reset
          </button>
        )}
        <span className="ml-auto text-sm font-sans text-ink/40">{filtered.length} agencies</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-line overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line">
              <th className="font-sans text-xs font-semibold text-ink/50 uppercase tracking-wider px-4 py-3 w-10">#</th>
              <th className="font-sans text-xs font-semibold text-ink/50 uppercase tracking-wider px-4 py-3">Details</th>
              <th className="font-sans text-xs font-semibold text-ink/50 uppercase tracking-wider px-4 py-3 text-center">Active Listings</th>
              <th className="font-sans text-xs font-semibold text-ink/50 uppercase tracking-wider px-4 py-3 text-center">Email Verified</th>
              <th className="font-sans text-xs font-semibold text-ink/50 uppercase tracking-wider px-4 py-3 text-center">Portal Status</th>
              <th className="font-sans text-xs font-semibold text-ink/50 uppercase tracking-wider px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => (
              <tr key={a.id} className="border-b border-line last:border-0 hover:bg-cream-alt transition-colors">
                <td className="px-4 py-4 font-sans text-sm text-ink/40">{i + 1}</td>
                <td className="px-4 py-4">
                  <div className="space-y-0.5">
                    <p className="font-sans text-sm font-semibold text-ink">{a.name ?? "—"}</p>
                    {a.email && (
                      <p className="font-sans text-xs text-blue-600">{a.email}</p>
                    )}
                    {a.org_name && (
                      <p className="font-sans text-xs text-ink/60">
                        <span className="text-ink/40">Org:</span> {a.org_name}
                      </p>
                    )}
                    {a.mobile && (
                      <p className="font-sans text-xs text-ink/60">
                        <span className="text-ink/40">Mobile:</span> {a.mobile}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 text-center font-sans text-sm text-ink/60">
                  {a.total_active_listings}
                </td>
                <td className="px-4 py-4 text-center">
                  {a.email_verified ? (
                    <span className="inline-block px-2 py-0.5 text-xs font-sans font-semibold bg-green-100 text-green-700 rounded">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 text-xs font-sans font-semibold bg-red-100 text-red-600 rounded">
                      Not Verified
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`inline-block px-2 py-0.5 text-xs font-sans font-semibold rounded ${
                    a.portal_status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {a.portal_status === "active" ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-1.5">
                    {a.total_active_listings > 0 && (
                      <a
                        href={`/admin/listings?agency=${a.id}`}
                        className="text-xs font-sans font-semibold text-blue-600 border border-blue-300 px-3 py-1 hover:bg-blue-50 transition-colors text-center"
                      >
                        VIEW LISTINGS
                      </a>
                    )}
                    <button
                      onClick={() => openModal(a)}
                      className="text-xs font-sans font-semibold text-white bg-black border border-black px-3 py-1 hover:bg-ink/80 transition-colors"
                    >
                      {a.portal_status === "active" ? "DEACTIVATE PORTAL" : "ACTIVATE PORTAL"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="text-center font-sans text-sm text-ink/40 py-12">No agencies match your filter.</p>
        )}
      </div>

      {/* Confirm modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-line w-full max-w-md p-6 shadow-lg">
            <h2 className="font-display font-semibold text-navy text-lg mb-1">
              {modal.action === "deactivate" ? "Deactivate Portal" : "Activate Portal"}
            </h2>
            <p className="font-sans text-sm text-ink/60 mb-4">
              {modal.action === "deactivate"
                ? `This will deactivate the portal for ${modal.agency.name ?? modal.agency.email}. They will lose access until reactivated.`
                : `This will reactivate the portal for ${modal.agency.name ?? modal.agency.email}.`}
            </p>
            <p className="font-sans text-sm text-ink mb-2">
              Type <span className="font-mono font-bold">{expected}</span> to confirm:
            </p>
            <input
              autoFocus
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={expected}
              className="w-full border border-line px-3 py-2 text-sm font-mono mb-4 focus:outline-none focus:border-navy"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={saving}
                className="font-sans text-sm px-4 py-2 border border-line text-ink/60 hover:bg-cream-alt transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirmText !== expected || saving}
                className="font-sans text-sm px-4 py-2 bg-black text-white font-semibold disabled:opacity-40 hover:bg-ink/80 transition-colors"
              >
                {saving ? "Saving..." : modal.action === "deactivate" ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
