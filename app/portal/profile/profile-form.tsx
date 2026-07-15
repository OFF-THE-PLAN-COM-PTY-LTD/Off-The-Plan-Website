"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  avatar_url: string | null;
  full_name: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  street_address: string | null;
  street_address_2: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  postcode: string | null;
  business_name: string | null;
  abn: string | null;
  about: string | null;
  company_email: string | null;
  company_phone: string | null;
  company_street: string | null;
  company_street_2: string | null;
  company_country: string | null;
  company_state: string | null;
  company_city: string | null;
  company_postcode: string | null;
  company_logo_url: string | null;
  developer_logo_url: string | null;
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  pinterest: string | null;
  youtube: string | null;
  website: string | null;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inp = "w-full border border-[#dde1e9] px-3 py-2 font-sans text-sm text-ink bg-white outline-none focus:border-orange/60 transition-colors";
const lbl = "block font-sans text-xs text-ink/60 mb-1";

// ─── Small helpers ────────────────────────────────────────────────────────────

function Row2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      {children}
    </div>
  );
}

function MakeChanges({ saving, saved, dirty }: { saving: boolean; saved: boolean; dirty: boolean }) {
  // Button greys out when nothing has been edited so re-clicking on an
  // unchanged form doesn't trigger a useless save + "Saved successfully"
  // flash. Active once any field in the section differs from the last
  // saved snapshot. Hover-class only applied when actionable.
  const disabled = saving || !dirty;
  return (
    <div className="flex items-center justify-end gap-3 mt-4">
      {saved && <span className="font-sans text-xs text-green-600">Saved successfully.</span>}
      <button
        type="submit"
        disabled={disabled}
        className={`font-mono text-[10px] uppercase tracking-widest px-5 py-2 border transition-colors ${
          disabled
            ? "border-line text-ink/30 cursor-not-allowed"
            : "border-orange text-orange hover:bg-orange hover:text-white"
        }`}
      >
        {saving ? "Saving…" : "Make Changes"}
      </button>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-[#dde1e9]">
      <div className="flex items-center gap-3">
        <div className="w-1 h-5 bg-orange" />
        <span className="font-sans font-semibold text-sm text-navy tracking-wide uppercase">{title}</span>
      </div>
    </div>
  );
}

// ─── Avatar Uploader ──────────────────────────────────────────────────────────

function AvatarUploader({ currentUrl, fullName, email }: { currentUrl: string | null; fullName: string | null; email: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("field", "avatar_url");
    const res = await fetch("/api/portal/upload", { method: "POST", body: form });
    const json = await res.json();
    if (res.ok) setPreview(json.url);
    setUploading(false);
  }

  return (
    <div className="flex items-center gap-6 px-6 py-5 bg-white border border-[#dde1e9]">
      <div className="w-20 h-20 rounded border border-[#dde1e9] bg-[#f5f6fa] overflow-hidden flex-shrink-0 flex items-center justify-center">
        {preview ? (
          <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-ink/20">
            <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="font-sans font-semibold text-sm text-navy">{fullName || email}</p>
        <p className="font-sans text-xs text-ink/50">{email}</p>
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            className="font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 border border-[#dde1e9] text-ink/40 cursor-not-allowed"
            disabled
          >
            Take a Photo
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 border border-orange text-orange hover:bg-orange hover:text-white transition-colors disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload Image"}
          </button>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ─── Password Change ──────────────────────────────────────────────────────────

function PasswordRow({ email }: { email: string }) {
  const [changing, setChanging] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleChange() {
    if (!newPassword || newPassword !== confirm) {
      setMsg({ type: "err", text: "Passwords don't match." });
      return;
    }
    if (newPassword.length < 8) {
      setMsg({ type: "err", text: "Minimum 8 characters." });
      return;
    }
    setSaving(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMsg({ type: "err", text: error.message });
    } else {
      setMsg({ type: "ok", text: "Password updated." });
      setChanging(false);
      setNewPassword("");
      setConfirm("");
    }
    setSaving(false);
  }

  return (
    <div>
      <label className={lbl}>Password</label>
      {!changing ? (
        <div className="flex items-center gap-3">
          <input type="password" value="placeholder" readOnly className={inp + " flex-1 text-ink/30 cursor-default"} />
          <button
            type="button"
            onClick={() => { setChanging(true); setMsg(null); }}
            className="font-mono text-[9px] uppercase tracking-widest px-4 py-2 border border-[#dde1e9] text-ink/50 hover:border-orange hover:text-orange transition-colors whitespace-nowrap"
          >
            Change Password
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inp} />
          <input type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inp} />
          {msg && <p className={`font-sans text-xs ${msg.type === "ok" ? "text-green-600" : "text-red-500"}`}>{msg.text}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleChange}
              disabled={saving}
              className="font-mono text-[9px] uppercase tracking-widest px-4 py-2 bg-orange text-white hover:bg-orange/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Update Password"}
            </button>
            <button
              type="button"
              onClick={() => { setChanging(false); setMsg(null); setNewPassword(""); setConfirm(""); }}
              className="font-mono text-[9px] uppercase tracking-widest px-4 py-2 border border-[#dde1e9] text-ink/40 hover:border-orange hover:text-orange transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Social Row ───────────────────────────────────────────────────────────────

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  facebook: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.887v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
  ),
  instagram: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="url(#ig)">
      <defs><linearGradient id="ig" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#f09433"/><stop offset="25%" stopColor="#e6683c"/><stop offset="50%" stopColor="#dc2743"/><stop offset="75%" stopColor="#cc2366"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  linkedin: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
  ),
  pinterest: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#E60023"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
  ),
  youtube: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  ),
  website: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e85d26" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  ),
};

function SocialRow({ field, label, value, onChange }: { field: string; label: string; value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#dde1e9] last:border-0">
      <div className="flex-shrink-0 w-6 flex items-center justify-center">{SOCIAL_ICONS[field]}</div>
      <div className="flex-1 min-w-0">
        <p className="font-sans text-xs text-ink/40 mb-0.5">{label}</p>
        {editing ? (
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`https://`}
            className={inp}
            autoFocus
          />
        ) : (
          <p className="font-sans text-sm text-ink/70 truncate">{value || <span className="text-ink/30 italic">Not set</span>}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => setEditing(!editing)}
        className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-ink/40 hover:text-orange transition-colors flex-shrink-0"
      >
        Edit
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
    </div>
  );
}

// ─── Logo Panel ───────────────────────────────────────────────────────────────

function LogoPanel({ field, title, currentUrl, className = "" }: { field: "company_logo_url" | "developer_logo_url"; title: string; currentUrl: string | null; className?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    // 5MB client-side cap before we even send to the server — saves a round-trip
    // and gives a clearer error than a generic upload failure.
    if (file.size > 5 * 1024 * 1024) {
      setError("File is over 5MB. Please choose a smaller image.");
      e.target.value = "";
      return;
    }
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("field", field);
    const res = await fetch("/api/portal/upload", { method: "POST", body: form });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setPreview(json.url);
    } else {
      setError(json.error ?? "Upload failed.");
    }
    setUploading(false);
    e.target.value = "";
  }

  return (
    <div className={`bg-white px-5 py-6 flex flex-col items-center gap-3 ${className}`}>
      <p className="font-mono text-[10px] uppercase tracking-widest text-navy font-bold">{title}</p>
      <div className="w-40 h-28 border border-[#dde1e9] bg-[#f5f6fa] flex items-center justify-center overflow-hidden">
        {preview ? (
          <img src={preview} alt={title} className="w-full h-full object-contain p-2" />
        ) : (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-ink/10">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="font-mono text-[9px] uppercase tracking-widest px-5 py-2 border border-[#dde1e9] text-ink/50 hover:border-orange hover:text-orange transition-colors disabled:opacity-50"
      >
        {uploading ? "Uploading…" : "Upload Logo"}
      </button>
      {error && <p className="font-sans text-[11px] text-red-600 text-center">{error}</p>}
      <LogoGuidelines />
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFile} />
    </div>
  );
}

/**
 * Shared guideline panel for logo uploads — used in /portal/profile and
 * /admin/developers. Addresses Tim's PDF I17: real-estate logos come in
 * many shapes; tells the uploader exactly what works best so the layout
 * stays consistent across the site.
 */
function LogoGuidelines() {
  return (
    <div className="bg-[#f5f6fa] border border-[#dde1e9] px-5 py-4 w-full">
      <p className="font-mono text-[11px] uppercase tracking-widest text-navy font-bold mb-3">
        Logo Guidelines
      </p>
      <ul className="font-sans text-[13px] text-ink/70 leading-relaxed space-y-1.5">
        <li><span className="text-ink/40 mr-1">•</span> Square (500×500) <span className="text-ink/40">or</span> rectangular (up to 1000×400) — both work</li>
        <li><span className="text-ink/40 mr-1">•</span> PNG with transparent background recommended</li>
        <li><span className="text-ink/40 mr-1">•</span> JPG / GIF / WEBP also accepted</li>
        <li><span className="text-ink/40 mr-1">•</span> Max file size 5MB</li>
        <li><span className="text-ink/40 mr-1">•</span> Avoid logos with thin lines or small text — they shrink in card views</li>
      </ul>
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export function ManageProfileForm({
  profile,
  developerDirectory = { eligible: false, optedIn: false },
}: {
  profile: ProfileData;
  developerDirectory?: { eligible: boolean; optedIn: boolean };
}) {
  // Personal details state
  const [firstName, setFirstName] = useState(profile.first_name ?? "");
  const [lastName, setLastName] = useState(profile.last_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [street, setStreet] = useState(profile.street_address ?? "");
  const [street2, setStreet2] = useState(profile.street_address_2 ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [state, setState] = useState(profile.state ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [postcode, setPostcode] = useState(profile.postcode ?? "");
  const [personalSaving, setPersonalSaving] = useState(false);
  const [personalSaved, setPersonalSaved] = useState(false);

  // Company details state
  const [businessName, setBusinessName] = useState(profile.business_name ?? "");
  const [abn, setAbn] = useState(profile.abn ?? "");
  const [about, setAbout] = useState(profile.about ?? "");
  const [companyEmail, setCompanyEmail] = useState(profile.company_email ?? "");
  const [companyPhone, setCompanyPhone] = useState(profile.company_phone ?? "");
  const [companyStreet, setCompanyStreet] = useState(profile.company_street ?? "");
  const [companyStreet2, setCompanyStreet2] = useState(profile.company_street_2 ?? "");
  const [companyCountry, setCompanyCountry] = useState(profile.company_country ?? "");
  const [companyState, setCompanyState] = useState(profile.company_state ?? "");
  const [companyCity, setCompanyCity] = useState(profile.company_city ?? "");
  const [companyPostcode, setCompanyPostcode] = useState(profile.company_postcode ?? "");
  const [companySaving, setCompanySaving] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);

  // Social state
  const [facebook, setFacebook] = useState(profile.facebook ?? "");
  const [instagram, setInstagram] = useState(profile.instagram ?? "");
  const [linkedin, setLinkedin] = useState(profile.linkedin ?? "");
  const [pinterest, setPinterest] = useState(profile.pinterest ?? "");
  const [youtube, setYoutube] = useState(profile.youtube ?? "");
  const [website, setWebsite] = useState(profile.website ?? "");
  const [socialSaving, setSocialSaving] = useState(false);
  const [socialSaved, setSocialSaved] = useState(false);

  // Snapshots of the last-saved values per section. Comparing the live
  // state to the snapshot tells us whether anything is "dirty" — used to
  // grey out the Make Changes button when there's nothing to save. After
  // a successful save we replace the snapshot so the button greys out
  // again until the next edit.
  const personalSnapshot = useRef({
    firstName: profile.first_name ?? "",
    lastName: profile.last_name ?? "",
    phone: profile.phone ?? "",
    street: profile.street_address ?? "",
    street2: profile.street_address_2 ?? "",
    country: profile.country ?? "",
    state: profile.state ?? "",
    city: profile.city ?? "",
    postcode: profile.postcode ?? "",
  });
  const companySnapshot = useRef({
    businessName: profile.business_name ?? "",
    abn: profile.abn ?? "",
    about: profile.about ?? "",
    companyEmail: profile.company_email ?? "",
    companyPhone: profile.company_phone ?? "",
    companyStreet: profile.company_street ?? "",
    companyStreet2: profile.company_street_2 ?? "",
    companyCountry: profile.company_country ?? "",
    companyState: profile.company_state ?? "",
    companyCity: profile.company_city ?? "",
    companyPostcode: profile.company_postcode ?? "",
  });
  const socialSnapshot = useRef({
    facebook: profile.facebook ?? "",
    instagram: profile.instagram ?? "",
    linkedin: profile.linkedin ?? "",
    pinterest: profile.pinterest ?? "",
    youtube: profile.youtube ?? "",
    website: profile.website ?? "",
  });

  const personalDirty =
    firstName !== personalSnapshot.current.firstName ||
    lastName !== personalSnapshot.current.lastName ||
    phone !== personalSnapshot.current.phone ||
    street !== personalSnapshot.current.street ||
    street2 !== personalSnapshot.current.street2 ||
    country !== personalSnapshot.current.country ||
    state !== personalSnapshot.current.state ||
    city !== personalSnapshot.current.city ||
    postcode !== personalSnapshot.current.postcode;

  const companyDirty =
    businessName !== companySnapshot.current.businessName ||
    abn !== companySnapshot.current.abn ||
    about !== companySnapshot.current.about ||
    companyEmail !== companySnapshot.current.companyEmail ||
    companyPhone !== companySnapshot.current.companyPhone ||
    companyStreet !== companySnapshot.current.companyStreet ||
    companyStreet2 !== companySnapshot.current.companyStreet2 ||
    companyCountry !== companySnapshot.current.companyCountry ||
    companyState !== companySnapshot.current.companyState ||
    companyCity !== companySnapshot.current.companyCity ||
    companyPostcode !== companySnapshot.current.companyPostcode;

  const socialDirty =
    facebook !== socialSnapshot.current.facebook ||
    instagram !== socialSnapshot.current.instagram ||
    linkedin !== socialSnapshot.current.linkedin ||
    pinterest !== socialSnapshot.current.pinterest ||
    youtube !== socialSnapshot.current.youtube ||
    website !== socialSnapshot.current.website;

  async function saveSection(
    fields: Record<string, string | null>,
    setSaving: (v: boolean) => void,
    setSaved: (v: boolean) => void,
    onSuccess?: () => void,
  ) {
    setSaving(true);
    const res = await fetch("/api/portal/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onSuccess?.();
    }
  }

  function handlePersonal(e: React.FormEvent) {
    e.preventDefault();
    saveSection(
      { first_name: firstName, last_name: lastName, phone, street_address: street, street_address_2: street2, country, state, city, postcode },
      setPersonalSaving, setPersonalSaved,
      () => { personalSnapshot.current = { firstName, lastName, phone, street, street2, country, state, city, postcode }; },
    );
  }

  function handleCompany(e: React.FormEvent) {
    e.preventDefault();
    saveSection(
      { business_name: businessName, abn, about, company_email: companyEmail, company_phone: companyPhone, company_street: companyStreet, company_street_2: companyStreet2, company_country: companyCountry, company_state: companyState, company_city: companyCity, company_postcode: companyPostcode },
      setCompanySaving, setCompanySaved,
      () => { companySnapshot.current = { businessName, abn, about, companyEmail, companyPhone, companyStreet, companyStreet2, companyCountry, companyState, companyCity, companyPostcode }; },
    );
  }

  function handleSocial(e: React.FormEvent) {
    e.preventDefault();
    saveSection(
      { facebook, instagram, linkedin, pinterest, youtube, website },
      setSocialSaving, setSocialSaved,
      () => { socialSnapshot.current = { facebook, instagram, linkedin, pinterest, youtube, website }; },
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {/* ── Avatar ── */}
      <AvatarUploader
        currentUrl={profile.avatar_url}
        fullName={profile.full_name}
        email={profile.email}
      />

      {/* ── Personal Details ── */}
      <div className="bg-white border border-[#dde1e9] border-t-0">
        <SectionHeader title="Personal Details" />
        <form onSubmit={handlePersonal} className="px-5 py-5 flex flex-col gap-4">
          <PasswordRow email={profile.email} />
          <Row2>
            <Field label="First Name *"><input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inp} /></Field>
            <Field label="Last Name"><input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inp} /></Field>
          </Row2>
          <Row2>
            <Field label="Email Address *">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <input type="email" value={profile.email} disabled className={inp + " pl-8 text-ink/40 cursor-not-allowed"} />
              </div>
            </Field>
            <Field label="Phone">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6z"/></svg>
                </span>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+61 8 9888 8888" className={inp + " pl-8"} />
              </div>
            </Field>
          </Row2>
          <Row2>
            <Field label="Street address"><input value={street} onChange={(e) => setStreet(e.target.value)} className={inp} /></Field>
            <Field label="Street address 2"><input value={street2} onChange={(e) => setStreet2(e.target.value)} className={inp} /></Field>
          </Row2>
          <Row2>
            <Field label="Country"><input value={country} onChange={(e) => setCountry(e.target.value)} className={inp} /></Field>
            <Field label="State"><input value={state} onChange={(e) => setState(e.target.value)} className={inp} /></Field>
          </Row2>
          <Row2>
            <Field label="City"><input value={city} onChange={(e) => setCity(e.target.value)} className={inp} /></Field>
            <Field label="PostCode"><input value={postcode} onChange={(e) => setPostcode(e.target.value)} className={inp} /></Field>
          </Row2>
          <MakeChanges saving={personalSaving} saved={personalSaved} dirty={personalDirty} />
        </form>
      </div>

      {/* ── Company Details ── */}
      <div className="bg-white border border-[#dde1e9] border-t-0">
        <SectionHeader title="Company Details" />
        <form onSubmit={handleCompany} className="px-5 py-5 flex flex-col gap-4">
          <Row2>
            <Field label="Business Name"><input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inp} /></Field>
            <Field label="ABN"><input value={abn} onChange={(e) => setAbn(e.target.value)} placeholder="11 222 333 444" className={inp} /></Field>
          </Row2>
          <Field label="About"><textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={3} className={inp + " resize-none"} /></Field>
          <Row2>
            <Field label="Email Address (if different from above)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} className={inp + " pl-8"} />
              </div>
            </Field>
            <Field label="Phone (if different from above)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6z"/></svg>
                </span>
                <input type="tel" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="+61 8 9888 8888" className={inp + " pl-8"} />
              </div>
            </Field>
          </Row2>
          <Row2>
            <Field label="Street address"><input value={companyStreet} onChange={(e) => setCompanyStreet(e.target.value)} className={inp} /></Field>
            <Field label="Street address 2"><input value={companyStreet2} onChange={(e) => setCompanyStreet2(e.target.value)} className={inp} /></Field>
          </Row2>
          <Row2>
            <Field label="Country"><input value={companyCountry} onChange={(e) => setCompanyCountry(e.target.value)} className={inp} /></Field>
            <Field label="State"><input value={companyState} onChange={(e) => setCompanyState(e.target.value)} className={inp} /></Field>
          </Row2>
          <Row2>
            <Field label="City"><input value={companyCity} onChange={(e) => setCompanyCity(e.target.value)} className={inp} /></Field>
            <Field label="PostCode"><input value={companyPostcode} onChange={(e) => setCompanyPostcode(e.target.value)} className={inp} /></Field>
          </Row2>
          <MakeChanges saving={companySaving} saved={companySaved} dirty={companyDirty} />
        </form>
      </div>

      {/* ── Logos ── */}
      <div className="grid grid-cols-2 border border-[#dde1e9] border-t-0">
        <LogoPanel field="company_logo_url" title="Profile Logo" currentUrl={profile.company_logo_url} />
        <LogoPanel field="developer_logo_url" title="Listings Logo" currentUrl={profile.developer_logo_url} className="border-l border-[#dde1e9]" />
      </div>

      {/* ── Social Reach ── */}
      <div className="bg-white border border-[#dde1e9] border-t-0">
        <SectionHeader title="Social Reach" />
        <form onSubmit={handleSocial} className="px-5 py-2">
          <SocialRow field="facebook"  label="Facebook"  value={facebook}  onChange={setFacebook} />
          <SocialRow field="instagram" label="Instagram" value={instagram} onChange={setInstagram} />
          <SocialRow field="linkedin"  label="Linkedin"  value={linkedin}  onChange={setLinkedin} />
          <SocialRow field="pinterest" label="Pinterest" value={pinterest} onChange={setPinterest} />
          <SocialRow field="youtube"   label="Youtube"   value={youtube}   onChange={setYoutube} />
          <SocialRow field="website"   label="Website"   value={website}   onChange={setWebsite} />
          <MakeChanges saving={socialSaving} saved={socialSaved} dirty={socialDirty} />
        </form>
      </div>

      {/* ── Public Developer Directory (only for developer-members) ── */}
      {developerDirectory.eligible && (
        <DeveloperDirectorySection initialOptedIn={developerDirectory.optedIn} />
      )}

      {/* ── Footer ── */}
      <div className="pt-5">
        <button
          type="button"
          className="font-mono text-[9px] uppercase tracking-widest px-4 py-2 border border-[#dde1e9] text-ink/40 hover:border-orange hover:text-orange transition-colors"
        >
          View and pay invoices
        </button>
      </div>
    </div>
  );
}

function DeveloperDirectorySection({ initialOptedIn }: { initialOptedIn: boolean }) {
  const [optedIn, setOptedIn] = useState(initialOptedIn);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(next: boolean) {
    setError(null);
    setSaving(true);
    const previous = optedIn;
    setOptedIn(next); // optimistic
    try {
      const res = await fetch("/api/portal/developer-directory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOptedIn(previous);
        setError(json.error ?? "Could not update directory visibility.");
        return;
      }
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  }

  const hideSavedAfter = 4000;
  const showSaved = savedAt !== null && Date.now() - savedAt < hideSavedAfter;

  return (
    <div className="bg-white border border-[#dde1e9] border-t-0">
      <SectionHeader title="Public Developer Directory" />
      <div className="px-5 py-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={optedIn}
            onChange={(e) => handleToggle(e.target.checked)}
            disabled={saving}
            className="w-4 h-4 accent-orange mt-0.5"
          />
          <div>
            <p className="font-sans text-sm text-ink">
              Show our company in the <a href="/developers" target="_blank" rel="noopener" className="text-orange hover:underline">public developers directory</a>.
            </p>
            <p className="font-sans text-xs text-ink/50 mt-1">
              Your business name, about text, developer logo, website, and state will be pulled from the fields above. Untick any time to hide your entry.
            </p>
          </div>
        </label>
        <div className="mt-3 min-h-[20px]">
          {saving && <span className="font-sans text-xs text-ink/40">Saving…</span>}
          {!saving && showSaved && <span className="font-sans text-xs text-green-600">Saved.</span>}
          {error && <span className="font-sans text-xs text-red-600">{error}</span>}
        </div>
      </div>
    </div>
  );
}
