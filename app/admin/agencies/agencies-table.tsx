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
  portal_status: "active" | "inactive" | "pending";
  // Joined from profiles.interest_type via email → auth.users → profiles in
  // page.tsx. "Developer" / "Agent" are the two values that appear on
  // profile rows we surface here; "Agent" is presented as "Member" in the UI.
  interest_type?: string | null;
  // Derived in page.tsx — true when agencies.email doesn't match any
  // Supabase Auth user (login deleted, or the row was never linked).
  is_archived?: boolean;
};

type EmailFilter = "all" | "verified" | "unverified";
type TypeFilter = "all" | "Developer" | "Agent";

/**
 * Tim's proposed migration password format (May 29 reply):
 *   month(2 digits)_clientNameWithSecondAndThirdLetterInCaps_year(2 digits)
 * e.g. "Platino" in May 2026 -> "05_pLAtino_26"
 *
 * We use this only as a suggested default in the password modal — the
 * admin can override it before saving.
 */
function suggestedPassword(name: string | null | undefined): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  const base = (name ?? "user").replace(/\s+/g, "").toLowerCase();
  const transformed = base
    .split("")
    .map((ch, i) => (i === 1 || i === 2 ? ch.toUpperCase() : ch))
    .join("");
  return `${mm}_${transformed || "user"}_${yy}`;
}

type StatusKey = "pending" | "active" | "inactive" | "archived" | "all";

interface Props {
  agencies: Agency[];
  activeStatus: StatusKey;
  counts: Record<StatusKey, number>;
}

export default function AgenciesTable({ agencies, activeStatus, counts }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [emailFilter, setEmailFilter] = useState<EmailFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  // Per-row role dropdown state. Server load populates the initial map from
  // the joined profiles.interest_type; user edits update it optimistically
  // and hit the API, reverting on failure. Keyed by agency.id.
  const [interestByAgency, setInterestByAgency] = useState<Record<string, string | null>>(
    () => Object.fromEntries(agencies.map((a) => [a.id, a.interest_type ?? null])),
  );
  const [savingInterestId, setSavingInterestId] = useState<string | null>(null);

  async function handleInterestChange(agencyId: string, newValue: string) {
    const prev = interestByAgency[agencyId] ?? null;
    const next = newValue === "" ? null : newValue;
    setInterestByAgency((m) => ({ ...m, [agencyId]: next }));
    setSavingInterestId(agencyId);
    try {
      const res = await fetch("/api/admin/agencies/interest-type", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId, interestType: next }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Failed to save" }));
        setInterestByAgency((m) => ({ ...m, [agencyId]: prev }));
        alert(error || "Failed to save role.");
      }
    } catch {
      setInterestByAgency((m) => ({ ...m, [agencyId]: prev }));
      alert("Network error — role not saved.");
    } finally {
      setSavingInterestId(null);
    }
  }

  // Confirm modal state
  const [modal, setModal] = useState<{ agency: Agency; action: "deactivate" | "activate" | "reject" } | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [saving, setSaving] = useState(false);

  // Sign-in-as-user (magic link) state
  const [signingInId, setSigningInId] = useState<string | null>(null);

  // Email "set your own password" link state
  const [emailingId, setEmailingId] = useState<string | null>(null);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkConfirmText, setBulkConfirmText] = useState("");

  const [approvingId, setApprovingId] = useState<string | null>(null);

  async function handleApprove(agency: Agency) {
    setApprovingId(agency.id);
    try {
      const res = await fetch("/api/admin/agencies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: agency.id, portal_status: "active" }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.error ?? "Approval failed.");
        return;
      }
      startTransition(() => router.refresh());
    } finally {
      setApprovingId(null);
    }
  }

  function handleReject(agency: Agency) {
    openRejectModal(agency);
  }

  // Set-password modal state
  const [pwModal, setPwModal] = useState<{ agency: Agency } | null>(null);
  const [pwValue, setPwValue] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  async function handleImpersonate(agency: Agency) {
    if (!agency.email) {
      alert("This agency has no email on file — cannot generate a sign-in link.");
      return;
    }
    setSigningInId(agency.id);
    try {
      const res = await fetch("/api/admin/users/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: agency.email }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        alert(json.error ?? "Could not generate sign-in link. Make sure the user has an account.");
        return;
      }
      window.open(json.url, "_blank", "noopener,noreferrer");
    } finally {
      setSigningInId(null);
    }
  }

  async function handleEmailLink(agency: Agency) {
    if (!agency.email) {
      alert("This agency has no email on file — cannot send a link.");
      return;
    }
    setEmailingId(agency.id);
    try {
      const res = await fetch("/api/admin/users/send-set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: agency.email }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error ?? "Could not send the email.");
        return;
      }
      alert(`Set-password link emailed to ${agency.email}.`);
    } finally {
      setEmailingId(null);
    }
  }

  const BULK_CONFIRM_PHRASE = "SEND TO ALL";

  async function handleBulkEmail() {
    if (bulkConfirmText !== BULK_CONFIRM_PHRASE) return;
    setBulkSending(true);
    try {
      const res = await fetch("/api/admin/users/send-set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "all-members" }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error ?? "Bulk send failed.");
        return;
      }
      setBulkModalOpen(false);
      setBulkConfirmText("");
      alert(
        `Done. Sent ${json.sent} of ${json.total} link${json.total === 1 ? "" : "s"}.` +
          (json.failed ? ` ${json.failed} failed — check server logs.` : ""),
      );
    } finally {
      setBulkSending(false);
    }
  }

  function openPwModal(agency: Agency) {
    setPwModal({ agency });
    setPwValue(suggestedPassword(agency.name ?? agency.org_name));
    setPwError(null);
    setPwSuccess(false);
  }

  function closePwModal() {
    setPwModal(null);
    setPwValue("");
    setPwError(null);
    setPwSuccess(false);
  }

  async function handleSetPassword() {
    if (!pwModal || !pwModal.agency.email) return;
    if (pwValue.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    setPwSaving(true);
    setPwError(null);
    try {
      const res = await fetch("/api/admin/users/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pwModal.agency.email, password: pwValue }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPwError(json.error ?? "Failed to set password.");
        return;
      }
      setPwSuccess(true);
    } finally {
      setPwSaving(false);
    }
  }

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
    // Filter reads from the live local map so a role change reflects in the
    // active filter immediately (e.g. change "—" to Developer while
    // Developers filter is on, row disappears without a page reload).
    const currentInterest = interestByAgency[a.id] ?? null;
    const matchesType =
      typeFilter === "all" || (currentInterest ?? "") === typeFilter;
    return matchesSearch && matchesEmail && matchesType;
  });

  function openModal(agency: Agency) {
    setModal({ agency, action: agency.portal_status === "active" ? "deactivate" : "activate" });
    setConfirmText("");
  }

  function openRejectModal(agency: Agency) {
    setModal({ agency, action: "reject" });
    setConfirmText("");
  }

  function closeModal() {
    setModal(null);
    setConfirmText("");
  }

  async function handleConfirm() {
    if (!modal) return;
    const expected =
      modal.action === "deactivate" ? "DEACTIVATE"
      : modal.action === "activate" ? "ACTIVATE"
      : "REJECT";
    if (confirmText !== expected) return;

    setSaving(true);
    try {
      const targetStatus =
        modal.action === "deactivate" || modal.action === "reject" ? "inactive" : "active";
      const res = await fetch("/api/admin/agencies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: modal.agency.id,
          portal_status: targetStatus,
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

  const expected =
    modal?.action === "deactivate" ? "DEACTIVATE"
    : modal?.action === "activate" ? "ACTIVATE"
    : modal?.action === "reject" ? "REJECT"
    : "";

  return (
    <>
      {/* Status filter chips — matches the Members tab pattern */}
      {/* "pending" hidden 2026-06-30 — accounts now auto-approve on signup so
          the tab would always be empty. Direct URL /admin/agencies?status=pending
          still works if we ever need it (or manually park an account). Re-add
          "pending" to the array below to bring the chip back. */}
      <div className="flex items-center gap-1 border-b border-line mb-4">
        {(["active", "inactive", "all", "archived"] as StatusKey[]).map((key) => {
          const label = key === "all" ? "All" : key.charAt(0).toUpperCase() + key.slice(1);
          const href = key === "all" ? "/admin/agencies" : `/admin/agencies?status=${key}`;
          const isActive = activeStatus === key;
          return (
            <a
              key={key}
              href={href}
              className={`font-mono text-[12px] uppercase tracking-widest px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
                isActive ? "border-orange text-ink" : "border-transparent text-ink/50 hover:text-ink"
              }`}
            >
              {label}
              <span className={`inline-flex items-center justify-center min-w-[18px] h-[16px] px-1 rounded-full text-[9px] font-bold ${
                isActive ? "bg-orange text-white" : "bg-ink/10 text-ink/60"
              }`}>
                {counts[key]}
              </span>
            </a>
          );
        })}
      </div>
      {/* Filter bar. On the Archived tab we strip out filters and bulk actions
          that require an auth user (Email Verified, Type, Email Set-Password
          Link to All) — they're all no-ops on orphaned rows. Search stays so
          Tim can jump to a specific archived name/email. */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Filter by Name / Email / Organisation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-line px-3 py-2 text-sm font-sans text-ink w-80 focus:outline-none focus:border-navy"
        />
        {activeStatus !== "archived" && (
          <>
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
            <div className="flex items-center gap-2 text-sm font-sans text-ink/60">
              <label htmlFor="typeFilter">Type</label>
              <select
                id="typeFilter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="border border-line px-2 py-2 text-sm font-sans text-ink bg-white focus:outline-none focus:border-navy"
              >
                <option value="all">All</option>
                <option value="Developer">Developers</option>
                <option value="Agent">Members</option>
              </select>
            </div>
          </>
        )}
        {(search || (activeStatus !== "archived" && (emailFilter !== "all" || typeFilter !== "all"))) && (
          <button
            onClick={() => { setSearch(""); setEmailFilter("all"); setTypeFilter("all"); }}
            className="text-sm font-sans text-blue-600 underline"
          >
            Reset
          </button>
        )}
        {activeStatus !== "archived" && (
          <button
            onClick={() => { setBulkConfirmText(""); setBulkModalOpen(true); }}
            disabled={bulkSending}
            title="Email every agency with an email on file a link to set their own password"
            className="ml-auto font-mono text-[10px] uppercase tracking-widest px-3 py-2 bg-black text-white font-semibold hover:bg-ink/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {bulkSending ? "Sending…" : "Email Set-Password Link to All"}
          </button>
        )}
        <span className={`text-sm font-sans font-semibold text-ink ${activeStatus === "archived" ? "ml-auto" : ""}`}>
          {filtered.length} {filtered.length === 1 ? "profile" : "profiles"}
        </span>
      </div>

      {/* Table. On Archived we drop everything except # and Details — Type,
          Active Listings, Email Verified, Portal Status and the entire Action
          column all rely on an auth user that no longer exists for these
          rows. Keeping the outer <table> so search/filter counts and layout
          stay consistent with the other tabs. */}
      <div className="bg-white border border-line overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line">
              <th className="font-sans text-xs font-semibold text-ink/50 uppercase tracking-wider px-4 py-3 w-10">#</th>
              <th className="font-sans text-xs font-semibold text-ink/50 uppercase tracking-wider px-4 py-3">Details</th>
              {activeStatus !== "archived" && (
                <>
                  <th className="font-sans text-xs font-semibold text-ink/50 uppercase tracking-wider px-4 py-3 text-center">Type</th>
                  <th className="font-sans text-xs font-semibold text-ink/50 uppercase tracking-wider px-4 py-3 text-center">Active Listings</th>
                  <th className="font-sans text-xs font-semibold text-ink/50 uppercase tracking-wider px-4 py-3 text-center">Email Verified</th>
                  <th className="font-sans text-xs font-semibold text-ink/50 uppercase tracking-wider px-4 py-3 text-center">Portal Status</th>
                  <th className="font-sans text-xs font-semibold text-ink/50 uppercase tracking-wider px-4 py-3">Action</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => (
              <tr key={a.id} className="border-b border-line last:border-0 hover:bg-cream-alt transition-colors">
                <td className="px-4 py-4 font-sans text-sm text-ink/40">{i + 1}</td>
                <td className="px-4 py-4">
                  <div className="space-y-0.5">
                    <p className="font-sans text-sm text-ink">
                      <span className="font-semibold">Name:</span> {a.name ?? "—"}
                    </p>
                    {a.email && (
                      <p className="font-sans text-xs text-ink/70">
                        <span className="font-semibold">Email:</span> {a.email}
                      </p>
                    )}
                    {a.org_name && (
                      <p className="font-sans text-xs text-ink/70">
                        <span className="font-semibold">Org. Name:</span>{" "}
                        {activeStatus === "archived" ? (
                          <span className="text-ink/70">{a.org_name}</span>
                        ) : (
                          <a href={`/admin/agencies/${a.id}`} className="text-blue-600 hover:underline">{a.org_name}</a>
                        )}
                      </p>
                    )}
                    {a.mobile && (
                      <p className="font-sans text-xs text-ink/70">
                        <span className="font-semibold">Mobile:</span> {a.mobile}
                      </p>
                    )}
                  </div>
                </td>
                {activeStatus !== "archived" && (<>
                <td className="px-4 py-4 text-center">
                  <select
                    value={interestByAgency[a.id] ?? ""}
                    onChange={(e) => handleInterestChange(a.id, e.target.value)}
                    disabled={savingInterestId === a.id}
                    aria-label="Profile role"
                    className="border border-line px-2 py-1 text-xs font-sans text-ink bg-white focus:outline-none focus:border-navy disabled:opacity-50"
                  >
                    <option value="">— Select —</option>
                    <option value="Developer">Developer</option>
                    <option value="Agent">Member</option>
                  </select>
                  {savingInterestId === a.id && (
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-ink/40">Saving…</p>
                  )}
                </td>
                <td className="px-4 py-4 text-center font-sans text-sm text-ink/60">
                  {a.total_active_listings}
                </td>
                <td className="px-4 py-4 text-center">
                  {a.email_verified ? (
                    <span className="inline-block font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-green-500 text-green-800">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-block font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-orange text-orange">
                      Not Verified
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`inline-block font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border ${
                    a.portal_status === "active"
                      ? "border-green-500 text-green-800"
                      : a.portal_status === "pending"
                      ? "border-orange text-orange bg-orange/10"
                      : "border-line text-ink"
                  }`}>
                    {a.portal_status === "active" ? "Active" : a.portal_status === "pending" ? "Pending" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-1.5 min-w-[180px]">
                    <div className="flex gap-1.5">
                      {a.total_active_listings > 0 && (
                        <a
                          href={`/admin/listings?agency=${a.id}`}
                          className="flex-1 text-center font-mono text-[10px] uppercase tracking-widest px-2 py-1.5 border border-line text-ink hover:border-navy hover:text-navy transition-colors whitespace-nowrap"
                        >
                          View Listings ({a.total_active_listings})
                        </a>
                      )}
                      <a
                        href={`/admin/agencies/${a.id}`}
                        className="flex-1 text-center font-mono text-[10px] uppercase tracking-widest px-2 py-1.5 border border-orange text-orange hover:bg-orange hover:text-white transition-colors whitespace-nowrap"
                      >
                        Manage Profile
                      </a>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleImpersonate(a)}
                        disabled={signingInId === a.id || !a.email}
                        title={a.email ? "Generate a one-time link and open this member's dashboard in a new tab" : "No email on file"}
                        className="flex-1 font-mono text-[10px] uppercase tracking-widest px-2 py-1.5 border border-navy text-navy hover:bg-navy hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {signingInId === a.id ? "…" : "Sign In As User"}
                      </button>
                      <button
                        onClick={() => openPwModal(a)}
                        disabled={!a.email}
                        title={a.email ? "Set or reset this member's password" : "No email on file"}
                        className="flex-1 font-mono text-[10px] uppercase tracking-widest px-2 py-1.5 border border-line text-ink hover:border-navy hover:text-navy transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        Set Password
                      </button>
                    </div>
                    <button
                      onClick={() => handleEmailLink(a)}
                      disabled={emailingId === a.id || !a.email}
                      title={a.email ? "Email this member a link to set their own password" : "No email on file"}
                      className="w-full font-mono text-[10px] uppercase tracking-widest px-2 py-1.5 border border-line text-ink hover:border-navy hover:text-navy transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {emailingId === a.id ? "Sending…" : "Email Set-Password Link"}
                    </button>
                    {a.portal_status === "pending" ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleApprove(a)}
                          disabled={approvingId === a.id}
                          className="flex-1 font-mono text-[10px] uppercase tracking-widest px-2 py-1.5 bg-green-700 text-white hover:bg-green-800 transition-colors disabled:opacity-50"
                        >
                          {approvingId === a.id ? "…" : "Approve"}
                        </button>
                        <button
                          onClick={() => handleReject(a)}
                          disabled={approvingId === a.id}
                          className="flex-1 font-mono text-[10px] uppercase tracking-widest px-2 py-1.5 bg-red-700 text-white hover:bg-red-800 transition-colors disabled:opacity-50"
                        >
                          {approvingId === a.id ? "…" : "Reject"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openModal(a)}
                        className={`w-full font-mono text-[10px] uppercase tracking-widest px-2 py-1.5 border transition-colors ${
                          a.portal_status === "active"
                            ? "border-red-400 text-red-700 hover:bg-red-500 hover:text-white hover:border-red-500"
                            : "border-green-500 text-green-800 hover:bg-green-500 hover:text-white hover:border-green-500"
                        }`}
                      >
                        {a.portal_status === "active" ? "Deactivate Portal" : "Activate Portal"}
                      </button>
                    )}
                  </div>
                </td>
                </>)}
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="text-center font-sans text-sm text-ink/40 py-12">
            {activeStatus === "archived" ? "No archived profiles." : "No agencies match your filter."}
          </p>
        )}
      </div>

      {/* Confirm modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-line w-full max-w-md p-6 shadow-lg">
            <h2 className="font-display font-semibold text-navy text-lg mb-1">
              {modal.action === "deactivate" ? "Deactivate Portal"
                : modal.action === "activate" ? "Activate Portal"
                : "Reject Application"}
            </h2>
            <p className="font-sans text-sm text-ink/60 mb-4">
              {modal.action === "deactivate"
                ? `This will deactivate the portal for ${modal.agency.name ?? modal.agency.email}. They will lose access until reactivated.`
                : modal.action === "activate"
                ? `This will reactivate the portal for ${modal.agency.name ?? modal.agency.email}.`
                : `This will reject ${modal.agency.name ?? modal.agency.email}'s application. They will receive a decline email and will not be able to sign in.`}
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
                {saving ? "Saving..." : modal.action === "deactivate" ? "Deactivate" : modal.action === "activate" ? "Activate" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set-password modal */}
      {pwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={pwSaving ? undefined : closePwModal}>
          <div className="bg-white border border-line w-full max-w-md p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-semibold text-navy text-lg mb-1">Set Password</h2>
            <p className="font-sans text-sm text-ink/60 mb-1">
              For <span className="font-semibold text-ink">{pwModal.agency.name ?? pwModal.agency.org_name ?? pwModal.agency.email}</span>
            </p>
            <p className="font-mono text-[11px] text-ink/40 mb-4">{pwModal.agency.email}</p>

            {pwSuccess ? (
              <>
                <div className="bg-green-50 border border-green-200 text-green-800 text-sm font-sans p-3 mb-4">
                  Password updated. Share it with the member — they can change it once logged in.
                </div>
                <p className="font-sans text-xs text-ink/50 mb-2">New password (copy now — it&apos;s not stored):</p>
                <div className="font-mono text-sm bg-cream-alt border border-line px-3 py-2 mb-4 break-all">
                  {pwValue}
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => navigator.clipboard?.writeText(pwValue)}
                    className="font-sans text-sm px-4 py-2 border border-line text-ink hover:bg-cream-alt transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onClick={closePwModal}
                    className="font-sans text-sm px-4 py-2 bg-black text-white font-semibold hover:bg-ink/80 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="font-sans text-sm text-ink mb-2">
                  New password{" "}
                  <span className="text-ink/40 text-xs">(suggested format pre-filled — edit as needed):</span>
                </p>
                <input
                  autoFocus
                  type="text"
                  value={pwValue}
                  onChange={(e) => { setPwValue(e.target.value); setPwError(null); }}
                  className="w-full border border-line px-3 py-2 text-sm font-mono mb-2 focus:outline-none focus:border-navy"
                />
                <p className="font-sans text-[11px] text-ink/40 mb-4">
                  Suggested format follows <span className="font-mono">MM_NameLetters_YY</span> per Tim&apos;s migration plan. Minimum 8 characters.
                </p>
                {pwError && (
                  <p className="font-sans text-sm text-red-600 mb-3">{pwError}</p>
                )}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={closePwModal}
                    disabled={pwSaving}
                    className="font-sans text-sm px-4 py-2 border border-line text-ink/60 hover:bg-cream-alt transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSetPassword}
                    disabled={pwValue.length < 8 || pwSaving}
                    className="font-sans text-sm px-4 py-2 bg-black text-white font-semibold disabled:opacity-40 hover:bg-ink/80 transition-colors"
                  >
                    {pwSaving ? "Saving..." : "Set Password"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bulk "email set-password link to all" — type-to-confirm guard */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={bulkSending ? undefined : () => setBulkModalOpen(false)}>
          <div className="bg-white border border-line w-full max-w-md p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-semibold text-navy text-lg mb-1">Email set-password link to all</h2>
            <p className="font-sans text-sm text-ink/60 mb-4">
              This emails a &ldquo;set your own password&rdquo; link to <span className="font-semibold text-ink">every agency with an email on file</span> ({agencies.length} total). Each person clicks it once to choose their password. Only do this at launch or when you intend to reset everyone.
            </p>
            <p className="font-sans text-sm text-ink mb-2">
              Type <span className="font-mono font-bold">{BULK_CONFIRM_PHRASE}</span> to confirm:
            </p>
            <input
              autoFocus
              type="text"
              value={bulkConfirmText}
              onChange={(e) => setBulkConfirmText(e.target.value)}
              placeholder={BULK_CONFIRM_PHRASE}
              className="w-full border border-line px-3 py-2 text-sm font-mono mb-4 focus:outline-none focus:border-navy"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setBulkModalOpen(false)}
                disabled={bulkSending}
                className="font-sans text-sm px-4 py-2 border border-line text-ink/60 hover:bg-cream-alt transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkEmail}
                disabled={bulkConfirmText !== BULK_CONFIRM_PHRASE || bulkSending}
                className="font-sans text-sm px-4 py-2 bg-black text-white font-semibold disabled:opacity-40 hover:bg-ink/80 transition-colors"
              >
                {bulkSending ? "Sending…" : "Send to all"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
