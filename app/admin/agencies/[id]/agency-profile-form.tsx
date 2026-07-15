"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";

type Agency = Record<string, any>;

const SOCIAL_PLATFORMS = [
  {
    key: "facebook_url",
    label: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#1877F2]">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.883v2.27h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
      </svg>
    ),
  },
  {
    key: "instagram_url",
    label: "Instagram",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#E1306C]">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    key: "linkedin_url",
    label: "LinkedIn",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#0A66C2]">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    key: "pinterest_url",
    label: "Pinterest",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#E60023]">
        <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
      </svg>
    ),
  },
  {
    key: "youtube_url",
    label: "Youtube",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#FF0000]">
        <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
      </svg>
    ),
  },
  {
    key: "website_url",
    label: "Website",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-gray-500">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.22.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
      </svg>
    ),
  },
];

export default function AgencyProfileForm({ agency }: { agency: Agency }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [personal, setPersonal] = useState({
    first_name: agency.first_name ?? "",
    last_name: agency.last_name ?? "",
    email: agency.email ?? "",
    mobile: agency.mobile ?? "",
    personal_street_address: agency.personal_street_address ?? "",
    personal_country: agency.personal_country ?? "",
    personal_state: agency.personal_state ?? "",
    personal_city: agency.personal_city ?? "",
    personal_postcode: agency.personal_postcode ?? "",
  });

  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [company, setCompany] = useState({
    org_name: agency.org_name ?? "",
    about: agency.about ?? "",
    org_email: agency.org_email ?? "",
    org_phone: agency.org_phone ?? "",
    org_street_address: agency.org_street_address ?? "",
    org_street_address_2: agency.org_street_address_2 ?? "",
    org_country: agency.org_country ?? "",
    org_state: agency.org_state ?? "",
    org_city: agency.org_city ?? "",
    org_postcode: agency.org_postcode ?? "",
  });

  const [socials, setSocials] = useState({
    facebook_url: agency.facebook_url ?? "",
    instagram_url: agency.instagram_url ?? "",
    linkedin_url: agency.linkedin_url ?? "",
    pinterest_url: agency.pinterest_url ?? "",
    youtube_url: agency.youtube_url ?? "",
    website_url: agency.website_url ?? "",
  });

  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingSocials, setSavingSocials] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function save(fields: Record<string, string>, setSaving: (v: boolean) => void) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/agencies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: agency.id, ...fields }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      showToast("Changes saved.");
      startTransition(() => router.refresh());
    } catch (e: any) {
      showToast(e.message ?? "Something went wrong.", false);
    } finally {
      setSaving(false);
    }
  }

  // Hidden file inputs for the two image slots (profile pic + the single logo).
  const profilePicRef = useRef<HTMLInputElement>(null);
  const orgLogoRef = useRef<HTMLInputElement>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  async function uploadImage(field: "profile_pic" | "org_logo_url", file: File) {
    setUploadingField(field);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "development-images");
      const upRes = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const upJson = await upRes.json();
      if (!upRes.ok) throw new Error(upJson.error ?? "Upload failed");

      const patchRes = await fetch("/api/admin/agencies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: agency.id, [field]: upJson.url }),
      });
      const patchJson = await patchRes.json();
      if (!patchRes.ok) throw new Error(patchJson.error ?? "Save failed");
      showToast("Image updated.");
      startTransition(() => router.refresh());
    } catch (e: any) {
      showToast(e.message ?? "Upload failed", false);
    } finally {
      setUploadingField(null);
    }
  }

  async function changePassword() {
    if (!newPassword) return;
    setSavingPassword(true);
    try {
      const res = await fetch("/api/admin/agencies/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: agency.id, password: newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      showToast("Password updated.");
      setNewPassword("");
    } catch (e: any) {
      showToast(e.message ?? "Something went wrong.", false);
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="relative">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 font-sans text-sm px-4 py-2 shadow-lg ${toast.ok ? "bg-navy text-white" : "bg-red-600 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* Page header bar */}
      <div className="bg-navy px-5 py-3 mb-4">
        <h1 className="font-sans font-semibold text-white text-sm uppercase tracking-widest">Manage Profile</h1>
      </div>

      {/* Profile header */}
      <div className="bg-white border border-line p-5 mb-4 flex items-center gap-4">
        {agency.profile_pic ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={agency.profile_pic} alt={agency.name ?? ""} className="w-16 h-16 rounded-full object-cover border border-line" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-cream-alt border border-line flex items-center justify-center font-display text-navy text-2xl font-bold">
            {(agency.name ?? "?")[0].toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-sans font-semibold text-ink text-base leading-tight">{agency.name ?? "—"}</p>
          {agency.email && <p className="font-sans text-sm text-ink/60 mt-0.5">{agency.email}</p>}
          <div className="flex gap-2 mt-2">
            <input
              ref={profilePicRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadImage("profile_pic", f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => profilePicRef.current?.click()}
              disabled={uploadingField === "profile_pic"}
              className="font-sans text-xs font-semibold px-3 py-1 border border-black bg-white hover:bg-cream-alt transition-colors uppercase tracking-wide disabled:opacity-50"
            >
              {uploadingField === "profile_pic" ? "Uploading…" : "Upload Image"}
            </button>
          </div>
        </div>
      </div>

      {/* Two-column: Personal | Company */}
      <div className="grid grid-cols-2 gap-4 mb-4">

        {/* Personal Details */}
        <div className="bg-white border border-line flex flex-col">
          <div className="px-5 py-3 border-b border-line">
            <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-ink">Personal Details</h2>
          </div>
          <div className="px-5 py-4 space-y-3 flex-1">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="First Name" value={personal.first_name} onChange={v => setPersonal(p => ({ ...p, first_name: v }))} />
              <FormField label="Last Name" value={personal.last_name} onChange={v => setPersonal(p => ({ ...p, last_name: v }))} />
            </div>
            <FormField label="Email Address" value={personal.email} onChange={v => setPersonal(p => ({ ...p, email: v }))} type="email" />
            <FormField label="Phone" value={personal.mobile} onChange={v => setPersonal(p => ({ ...p, mobile: v }))} />
            <FormField label="Street Address" value={personal.personal_street_address} onChange={v => setPersonal(p => ({ ...p, personal_street_address: v }))} />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Country" value={personal.personal_country} onChange={v => setPersonal(p => ({ ...p, personal_country: v }))} />
              <FormField label="State" value={personal.personal_state} onChange={v => setPersonal(p => ({ ...p, personal_state: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="City" value={personal.personal_city} onChange={v => setPersonal(p => ({ ...p, personal_city: v }))} />
              <FormField label="PostCode" value={personal.personal_postcode} onChange={v => setPersonal(p => ({ ...p, personal_postcode: v }))} />
            </div>

            {/* Change password */}
            <div className="border-t border-line pt-3">
              <p className="font-sans text-xs text-ink/40 uppercase tracking-wider mb-2">Change Password</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="New password (min. 6 chars)"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="flex-1 border border-line px-3 py-2 text-sm font-sans text-ink focus:outline-none focus:border-navy"
                />
                <button
                  onClick={changePassword}
                  disabled={savingPassword || newPassword.length < 6}
                  className="font-sans text-xs font-semibold px-3 py-2 bg-black text-white uppercase tracking-wide hover:bg-ink/80 transition-colors disabled:opacity-40"
                >
                  {savingPassword ? "..." : "Set"}
                </button>
              </div>
            </div>
          </div>
          <div className="px-5 py-3 border-t border-line flex justify-end">
            <MakeChangesButton saving={savingPersonal} onClick={() => save(personal, setSavingPersonal)} />
          </div>
        </div>

        {/* Company Details */}
        <div className="bg-white border border-line flex flex-col">
          <div className="px-5 py-3 border-b border-line">
            <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-ink">Company Details</h2>
          </div>
          <div className="px-5 py-4 space-y-3 flex-1">
            <FormField label="Business Name" value={company.org_name} onChange={v => setCompany(c => ({ ...c, org_name: v }))} />
            <div>
              <p className="font-sans text-xs text-ink/40 uppercase tracking-wider mb-1">About</p>
              <textarea
                value={company.about}
                onChange={e => setCompany(c => ({ ...c, about: e.target.value }))}
                rows={4}
                className="w-full border border-line px-3 py-2 text-sm font-sans text-ink focus:outline-none focus:border-navy resize-y"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Email Address (if different)" value={company.org_email} onChange={v => setCompany(c => ({ ...c, org_email: v }))} type="email" />
              <FormField label="Phone" value={company.org_phone} onChange={v => setCompany(c => ({ ...c, org_phone: v }))} />
            </div>
            <FormField label="Street Address" value={company.org_street_address} onChange={v => setCompany(c => ({ ...c, org_street_address: v }))} />
            <FormField label="Street Address 2" value={company.org_street_address_2} onChange={v => setCompany(c => ({ ...c, org_street_address_2: v }))} />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Country" value={company.org_country} onChange={v => setCompany(c => ({ ...c, org_country: v }))} />
              <FormField label="State" value={company.org_state} onChange={v => setCompany(c => ({ ...c, org_state: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="City" value={company.org_city} onChange={v => setCompany(c => ({ ...c, org_city: v }))} />
              <FormField label="PostCode" value={company.org_postcode} onChange={v => setCompany(c => ({ ...c, org_postcode: v }))} />
            </div>
          </div>
          <div className="px-5 py-3 border-t border-line flex justify-end">
            <MakeChangesButton saving={savingCompany} onClick={() => save(company, setSavingCompany)} />
          </div>
        </div>
      </div>

      {/* Logo — a single slot. The consolidated `accounts` table has one
          logo column (logo_url); the old two-slot layout ("Company" and
          "Developer") both wrote to that same column, so the boxes were
          duplicates that overwrote each other. One slot now, one source of truth. */}
      <div className="bg-white border border-line mb-4">
        <div className="px-5 py-3 border-b border-line">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-ink">Logo</h2>
        </div>
        <div className="p-5 text-center">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ink mb-3">Company Logo</p>
          {agency.org_logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={agency.org_logo_url} alt="Company logo" className="mx-auto max-h-24 max-w-full object-contain mb-3" />
          ) : (
            <div className="h-24 flex items-center justify-center text-ink/25 text-sm font-sans italic mb-3">No logo uploaded</div>
          )}
          <input
            ref={orgLogoRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadImage("org_logo_url", f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => orgLogoRef.current?.click()}
            disabled={uploadingField === "org_logo_url"}
            className="font-sans text-xs font-semibold px-4 py-1.5 border border-black bg-white hover:bg-cream-alt transition-colors uppercase tracking-wide disabled:opacity-50"
          >
            {uploadingField === "org_logo_url" ? "Uploading…" : "Upload Logo"}
          </button>
          <p className="font-sans text-xs text-ink/40 mt-3 max-w-sm mx-auto">
            Shown on the public developers directory and the developer&apos;s profile page.
          </p>
        </div>
      </div>

      {/* Social Reach */}
      <div className="bg-white border border-line">
        <div className="px-5 py-3 border-b border-line">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-ink">Social Reach</h2>
        </div>
        <div className="grid grid-cols-2 divide-x divide-line">
          <div className="divide-y divide-line">
            {SOCIAL_PLATFORMS.slice(0, 3).map(platform => (
              <SocialRow key={platform.key} platform={platform} value={(socials as any)[platform.key]} onChange={v => setSocials(s => ({ ...s, [platform.key]: v }))} />
            ))}
          </div>
          <div className="divide-y divide-line">
            {SOCIAL_PLATFORMS.slice(3).map(platform => (
              <SocialRow key={platform.key} platform={platform} value={(socials as any)[platform.key]} onChange={v => setSocials(s => ({ ...s, [platform.key]: v }))} />
            ))}
          </div>
        </div>
        <div className="px-5 py-3 border-t border-line flex justify-end">
          <MakeChangesButton saving={savingSocials} onClick={() => save(socials, setSavingSocials)} />
        </div>
      </div>
    </div>
  );
}

function SocialRow({ platform, value, onChange }: { platform: any; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div className="w-5 shrink-0">{platform.icon}</div>
      <input
        type="url"
        placeholder={platform.label}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 border border-line px-3 py-1.5 text-sm font-sans text-ink focus:outline-none focus:border-navy"
      />
    </div>
  );
}

function FormField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <p className="font-sans text-xs text-ink/40 uppercase tracking-wider mb-1">{label}</p>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-line px-3 py-2 text-sm font-sans text-ink focus:outline-none focus:border-navy"
      />
    </div>
  );
}

function MakeChangesButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="font-sans text-xs font-semibold px-5 py-2 bg-black text-white uppercase tracking-widest hover:bg-ink/80 transition-colors disabled:opacity-50"
    >
      {saving ? "Saving..." : "Make Changes"}
    </button>
  );
}
