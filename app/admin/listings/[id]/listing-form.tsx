"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/admin/image-upload";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Developer { id: string; name: string }
interface GalleryImage { id: string; url: string; sort_order: number }
interface FloorPlan {
  id?: string;
  beds: string;
  bath: string;
  garage: string;
  internal_sqm: string;
  price_from: string;
  plan_type: string;
  config: string;
  image_url: string;
}

interface ListingData {
  id?: string;
  // Category
  type?: string;
  tag?: string;
  tier?: string | null;
  // Project Overview
  name?: string;
  slug?: string;
  developer_id?: string | null;
  developer_website?: string;
  listing_duration?: string;
  logo_url?: string;
  residence_count?: number | null;
  // Address
  street_address?: string;
  street_address_2?: string;
  country?: string;
  state?: string;
  city?: string;
  postcode?: string;
  suburb?: string;
  location_description?: string;
  // Sale office
  sale_office_street?: string;
  sale_office_street_2?: string;
  sale_office_country?: string;
  sale_office_state?: string;
  sale_office_city?: string;
  sale_office_postcode?: string;
  // Details
  display_suite_timing?: string;
  description?: string;
  summary?: string;
  status?: string;
  is_published?: boolean;
  is_featured?: boolean;
  lat?: number | null;
  lng?: number | null;
  // Pricing / dates
  price_from?: number | null;
  search_price_max?: number | null;
  price_display?: string;
  show_price_on_search?: boolean;
  promotional_banner?: string;
  completion_quarter?: string;
  configuration_label?: string;
  // Configuration Summary
  beds_min?: number | null;
  beds_max?: number | null;
  baths_min?: number | null;
  baths_max?: number | null;
  cars_min?: number | null;
  cars_max?: number | null;
  levels?: number | null;
  internal_sqm_min?: number | null;
  internal_sqm_max?: number | null;
  land_size_min?: number | null;
  land_size_max?: number | null;
  // Features
  lifestyle?: string[];
  features?: string[] | null;
  architect?: string;
  interiors?: string;
  landscape?: string;
  builder?: string;
  // Amenities
  nearby_amenities?: string[] | null;
  // Agent
  agent_name?: string;
  agent_phone?: string;
  agent_email?: string;
  agent_agency?: string;
  // Uploads
  hero_image_url?: string;
  hero_alt_text?: string;
  feature_image_url?: string;
  brochure_url?: string;
  video_url?: string;
  agent_logo_1?: string;
  agent_logo_2?: string;
  virtual_tour_url?: string;
  floor_plan_upload_url?: string;
  additional_video_url?: string;
  price_list_url?: string;
  specifications_url?: string;
  // SEO
  seo_title?: string;
  seo_description?: string;
}

interface Agent {
  id?: string;
  name: string;
  email: string;
  mobile: string;
  photo_url: string;
  isNew?: boolean;
  saving?: boolean;
  deleting?: boolean;
}

interface Props {
  id: string;
  existing?: ListingData;
  developers: Developer[];
  gallery: GalleryImage[];
  floorPlans: FloorPlan[];
  agents: Omit<Agent, "isNew" | "saving" | "deleting">[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const AU_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

const TYPES = [
  "Apartment", "House & Land", "Townhouse", "Villa",
  "Land", "Commercial", "Mixed Use",
];

const STATUSES = [
  "Selling now", "Final release", "Register interest", "Cancelled", "Archived",
];

const LISTING_DURATIONS = ["3 Months", "6 Months", "12 Months", "24 Months"];

const LIFESTYLE_OPTIONS = [
  "Bar area",
  "BBQ Facilities",
  "Bike share",
  "Bin Chute",
  "Book Retreat and Library",
  "Building manager / Concierge",
  "Business center",
  "Cabanas",
  "Car share",
  "City views",
  "Co working options",
  "Consultation Room",
  "Delivery Room",
  "Dining room(s)",
  "EV charging capability",
  "Fireplaces",
  "Fully Equipped Gym",
  "Guest apartment",
  "Jacuzzi/Spa(s)",
  "Kids Play Area",
  "Lounge and Casual dining",
  "Massage Room",
  "Music Room",
  "Outdoor fireplace",
  "Outdoor Gym",
  "Outdoor Theatre",
  "Putting Green",
  "Rooftop Garden",
  "Sauna and Steam Rooms",
  "Sky Deck",
  "Swimming Pool(s)",
  "Tennis Courts",
  "Teppanyaki Grill",
  "Theatre",
  "Waterfront",
  "Wine Cellar",
  "Yoga Studio",
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function AccordionSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-line">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-cream-alt transition-colors"
      >
        <span className="font-mono text-[11px] uppercase tracking-widest text-navy font-bold">
          {title}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-ink/40 transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-line px-5 py-5 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-widest text-orange border-b border-orange/20 pb-1 mt-5 mb-4">
      {label}
    </p>
  );
}

function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  function addTag() {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setInput("");
  }

  return (
    <div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest px-2 py-1 bg-navy/5 border border-line text-ink/70"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== tag))}
                className="text-ink/40 hover:text-red-500 ml-0.5 leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); addTag(); }
          }}
          placeholder={placeholder ?? "Type and press Enter to add"}
          className="flex-1 border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 transition-colors"
        />
        <button
          type="button"
          onClick={addTag}
          className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-line text-ink/60 hover:border-navy hover:text-navy transition-colors whitespace-nowrap"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function AddYourOwn({
  lifestyle,
  setLifestyle,
}: {
  lifestyle: string[];
  setLifestyle: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  function add() {
    const trimmed = value.trim();
    if (trimmed && !lifestyle.includes(trimmed)) {
      setLifestyle((prev) => [...prev, trimmed]);
    }
    setValue("");
    setOpen(false);
  }

  const custom = lifestyle.filter((item) => !LIFESTYLE_OPTIONS.includes(item));

  return (
    <div className="mt-4">
      {custom.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {custom.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 font-sans text-sm text-ink/80"
            >
              <input type="checkbox" checked readOnly className="w-4 h-4 accent-orange flex-shrink-0" />
              {item}
              <button
                type="button"
                onClick={() => setLifestyle((prev) => prev.filter((x) => x !== item))}
                className="text-ink/30 hover:text-red-500 ml-1 leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      {open ? (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
            placeholder="Enter feature name"
            autoFocus
            className="border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 transition-colors w-64"
          />
          <button type="button" onClick={add} className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors">
            Add
          </button>
          <button type="button" onClick={() => { setOpen(false); setValue(""); }} className="font-mono text-[10px] uppercase tracking-widest text-ink/40 hover:text-ink transition-colors">
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-sans text-sm text-orange hover:underline mt-1"
        >
          + Add your own
        </button>
      )}
    </div>
  );
}

function SingleUpload({
  label,
  hint,
  value,
  onChange,
  altText,
  onAltTextChange,
  accept = "image/jpeg,image/png,image/webp",
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  altText?: string;
  onAltTextChange?: (v: string) => void;
  accept?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isImageOnly = !accept.includes("pdf");

  async function upload(file: File) {
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "development-images");
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const json = await res.json();
    if (res.ok) onChange(json.url);
    else setUploadError(json.error ?? "Upload failed");
    setUploading(false);
  }

  const filename = value ? value.split("/").pop() : null;

  return (
    <div className="border-b border-line pb-5 mb-5 last:border-0 last:mb-0 last:pb-0">
      {filename && (
        <div className="flex items-center gap-2 mb-1">
          <a href={value} target="_blank" rel="noopener noreferrer" className="font-sans text-sm text-orange hover:underline truncate max-w-xs">
            {filename}
          </a>
          <button type="button" onClick={() => onChange("")} className="text-red-400 hover:text-red-600 flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      )}
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <p className="font-sans text-sm font-medium text-ink/80 mb-2">
            {label}
          </p>
          <div className="flex items-center gap-3 mb-1.5">
            <input ref={inputRef} type="file" accept={accept} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} className="sr-only" />
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors disabled:opacity-50 whitespace-nowrap">
              {uploading ? "Uploading…" : value ? "Select Another File" : "Select File"}
            </button>
            {!value && <span className="font-sans text-sm text-ink/40">No file chosen</span>}
          </div>
          {uploadError && <p className="font-sans text-xs text-red-500 mb-1">{uploadError}</p>}
          {hint && <p className="font-sans text-xs text-ink/40">{hint}</p>}
          {isImageOnly && <p className="font-sans text-xs text-ink/40 mt-1">Or upload photo from your computer.</p>}
          {isImageOnly && value && (
            <div className="mt-2">
              <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Or paste an image URL" className="w-full border border-line px-2 py-1.5 bg-white font-sans text-xs text-ink/60 outline-none focus:border-orange/60" />
            </div>
          )}
        </div>
        {onAltTextChange !== undefined && (
          <div className="w-72 flex-shrink-0">
            <p className="font-sans text-sm text-ink/70 mb-2">Main Photo Alt Text:</p>
            <input type="text" value={altText ?? ""} onChange={(e) => onAltTextChange(e.target.value)} className="w-full border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 transition-colors" />
          </div>
        )}
      </div>
    </div>
  );
}

function AgentManager({
  developmentId,
  initialAgents,
}: {
  developmentId: string;
  initialAgents: Omit<Agent, "isNew" | "saving" | "deleting">[];
}) {
  const [agents, setAgents] = useState<Agent[]>(
    initialAgents.map((a) => ({ ...a, isNew: false, saving: false, deleting: false }))
  );
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  function addAgent() {
    setAgents((prev) => [
      ...prev,
      { name: "", email: "", mobile: "", photo_url: "", isNew: true, saving: false, deleting: false },
    ]);
  }

  function updateField(index: number, field: keyof Agent, value: string) {
    setAgents((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  }

  async function uploadPhoto(index: number, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "development-images");
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const json = await res.json();
    if (res.ok) updateField(index, "photo_url", json.url);
  }

  async function saveAgent(index: number) {
    const agent = agents[index];
    setAgents((prev) => prev.map((a, i) => (i === index ? { ...a, saving: true } : a)));

    let id = agent.id;
    if (agent.isNew) {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ development_id: developmentId, name: agent.name, email: agent.email, mobile: agent.mobile, photo_url: agent.photo_url, sort_order: index }),
      });
      const json = await res.json();
      if (res.ok) id = json.id;
    } else {
      await fetch("/api/admin/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: agent.id, name: agent.name, email: agent.email, mobile: agent.mobile, photo_url: agent.photo_url }),
      });
    }

    setAgents((prev) =>
      prev.map((a, i) => (i === index ? { ...a, id, isNew: false, saving: false } : a))
    );
  }

  async function deleteAgent(index: number) {
    const agent = agents[index];
    if (agent.isNew) {
      setAgents((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    setAgents((prev) => prev.map((a, i) => (i === index ? { ...a, deleting: true } : a)));
    await fetch("/api/admin/agents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: agent.id }),
    });
    setAgents((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div>
      {agents.length > 0 && (
        <div className="mb-4">
          {/* Header */}
          <div className="grid grid-cols-[64px_1fr_1fr_1fr_220px_160px] gap-3 items-center px-2 pb-2 border-b border-line mb-3">
            <div />
            <p className="font-sans text-sm text-ink/60">Name</p>
            <p className="font-sans text-sm text-ink/60">Email</p>
            <p className="font-sans text-sm text-ink/60">Mobile</p>
            <div>
              <p className="font-sans text-sm text-ink/60">Upload profile pic or logo</p>
              <p className="font-sans text-[10px] text-ink/30">(File size: up to 5MB, Dimensions: 500×500)</p>
            </div>
            <div />
          </div>

          {agents.map((agent, i) => (
            <div key={i} className="grid grid-cols-[64px_1fr_1fr_1fr_220px_160px] gap-3 items-center px-2 py-3 border-b border-line last:border-0">
              {/* Photo */}
              <div className="relative w-14 h-14 bg-navy/5 border border-line overflow-hidden flex-shrink-0">
                {agent.photo_url ? (
                  <Image src={agent.photo_url} alt={agent.name} fill className="object-cover" sizes="56px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink/20">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Name */}
              <input
                type="text"
                value={agent.name}
                onChange={(e) => updateField(i, "name", e.target.value)}
                placeholder="Agent name"
                className="border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 transition-colors w-full"
              />

              {/* Email */}
              <input
                type="email"
                value={agent.email}
                onChange={(e) => updateField(i, "email", e.target.value)}
                placeholder="agent@example.com"
                className="border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 transition-colors w-full"
              />

              {/* Mobile */}
              <input
                type="tel"
                value={agent.mobile}
                onChange={(e) => updateField(i, "mobile", e.target.value)}
                placeholder="04XX XXX XXX"
                className="border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 transition-colors w-full"
              />

              {/* Photo upload */}
              <div className="flex items-center gap-1.5">
                <input
                  ref={(el) => { fileRefs.current[i] = el; }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(i, f); e.target.value = ""; }}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => fileRefs.current[i]?.click()}
                  className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors whitespace-nowrap"
                >
                  {agent.photo_url ? "Change Photo" : "Select File"}
                </button>
                {agent.photo_url && (
                  <button
                    type="button"
                    onClick={() => updateField(i, "photo_url", "")}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    title="Remove photo"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Save / Delete */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => saveAgent(i)}
                  disabled={agent.saving || agent.deleting}
                  className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-teal-400 text-teal-600 hover:bg-teal-500 hover:text-white hover:border-teal-500 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {agent.saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => deleteAgent(i)}
                  disabled={agent.saving || agent.deleting}
                  className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-red-300 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {agent.deleting ? "…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addAgent}
        className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors"
      >
        + Add
      </button>
    </div>
  );
}

function GalleryManager({
  gallery,
  onAdd,
  onRemove,
}: {
  gallery: GalleryImage[];
  onAdd: (url: string) => void;
  onRemove: (id: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadImage(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "development-images");
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const json = await res.json();
    if (res.ok) onAdd(json.url);
    setUploading(false);
  }

  return (
    <div className="border-b border-line pb-5 mb-5">
      <div className="flex items-start gap-8">
        {/* Left: upload controls */}
        <div className="flex-shrink-0 w-72">
          <p className="font-sans text-sm font-medium text-ink/80 mb-2">
            Select up to 20 images
          </p>
          <div className="flex items-center gap-3 mb-1.5">
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }} className="sr-only" />
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading || gallery.length >= 20} className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors disabled:opacity-50 whitespace-nowrap">
              {uploading ? "Uploading…" : "Select File"}
            </button>
            {!uploading && <span className="font-sans text-sm text-ink/40">No file chosen</span>}
          </div>
          <p className="font-sans text-xs text-ink/40">Or upload photo from your computer.</p>
          <p className="font-sans text-xs text-ink/40">(File size: up to 10MB, Dimensions: 1920×1080)</p>
          {gallery.length >= 20 && (
            <p className="font-sans text-xs text-orange mt-1">Maximum 20 images reached.</p>
          )}
        </div>

        {/* Right: numbered list */}
        {gallery.length > 0 && (
          <div className="flex-1">
            <p className="font-sans text-sm text-orange hover:underline cursor-default mb-3">
              Click and drag images to change their order
            </p>
            <div className="flex flex-col gap-2">
              {gallery.map((img, i) => {
                const filename = img.url.split("/").pop() ?? img.url;
                return (
                  <div key={img.id} className="flex items-center gap-3">
                    <span className="font-sans text-sm text-ink/50 w-4 flex-shrink-0">{i + 1}.</span>
                    <div className="relative w-10 h-10 overflow-hidden bg-navy/5 flex-shrink-0">
                      <Image src={img.url} alt="" fill className="object-cover" sizes="40px" />
                    </div>
                    <a href={img.url} target="_blank" rel="noopener noreferrer" className="font-sans text-sm text-orange hover:underline truncate flex-1 max-w-xs">
                      {filename}
                    </a>
                    <button type="button" onClick={() => onRemove(img.id)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Form ───────────────────────────────────────────────────────────────

export function ListingForm({
  id,
  existing,
  developers,
  gallery: initialGallery,
  floorPlans: initialFloorPlans,
  agents,
}: Props) {
  const router = useRouter();
  const isNew = id === "new";

  // Category
  const [type, setType] = useState(existing?.type ?? "");
  const [tag, setTag] = useState(existing?.tag ?? "");
  const [tier, setTier] = useState(existing?.tier ?? "");

  // Project Overview – identity
  const [name, setName] = useState(existing?.name ?? "");
  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [developerId, setDeveloperId] = useState(existing?.developer_id ?? "");
  const [developerWebsite, setDeveloperWebsite] = useState(existing?.developer_website ?? "");
  const [listingDuration, setListingDuration] = useState(existing?.listing_duration ?? "");
  const [logoUrl, setLogoUrl] = useState(existing?.logo_url ?? "");
  const [residenceCount, setResidenceCount] = useState<number | "">(existing?.residence_count ?? "");

  // Address
  const [streetAddress, setStreetAddress] = useState(existing?.street_address ?? "");
  const [streetAddress2, setStreetAddress2] = useState(existing?.street_address_2 ?? "");
  const [country, setCountry] = useState(existing?.country ?? "Australia");
  const [state, setState] = useState(existing?.state ?? "");
  const [city, setCity] = useState(existing?.city ?? "");
  const [postcode, setPostcode] = useState(existing?.postcode ?? "");
  const [suburb, setSuburb] = useState(existing?.suburb ?? "");
  const [locationDescription, setLocationDescription] = useState(existing?.location_description ?? "");

  // Sale office address
  const [saleOfficeStreet, setSaleOfficeStreet] = useState(existing?.sale_office_street ?? "");
  const [saleOfficeStreet2, setSaleOfficeStreet2] = useState(existing?.sale_office_street_2 ?? "");
  const [saleOfficeCountry, setSaleOfficeCountry] = useState(existing?.sale_office_country ?? "");
  const [saleOfficeState, setSaleOfficeState] = useState(existing?.sale_office_state ?? "");
  const [saleOfficeCity, setSaleOfficeCity] = useState(existing?.sale_office_city ?? "");
  const [saleOfficePostcode, setSaleOfficePostcode] = useState(existing?.sale_office_postcode ?? "");

  // Description & timing
  const [displaySuiteTiming, setDisplaySuiteTiming] = useState(existing?.display_suite_timing ?? "");
  const [description, setDescription] = useState(existing?.description ?? existing?.summary ?? "");
  const [status, setStatus] = useState(existing?.status ?? "Selling now");
  const [isPublished, setIsPublished] = useState(existing?.is_published ?? false);
  const [isFeatured, setIsFeatured] = useState(existing?.is_featured ?? false);
  const [lat, setLat] = useState<number | "">(existing?.lat ?? "");
  const [lng, setLng] = useState<number | "">(existing?.lng ?? "");

  // Pricing & dates
  const [priceFrom, setPriceFrom] = useState<number | "">(existing?.price_from ?? "");
  const [searchPriceMax, setSearchPriceMax] = useState<number | "">(existing?.search_price_max ?? "");
  const [priceDisplay, setPriceDisplay] = useState(existing?.price_display ?? "");
  const [showPriceOnSearch, setShowPriceOnSearch] = useState(existing?.show_price_on_search ?? true);
  const [promotionalBanner, setPromotionalBanner] = useState(existing?.promotional_banner ?? "");
  const [completionQuarter, setCompletionQuarter] = useState(existing?.completion_quarter ?? "");
  const [configurationLabel, setConfigurationLabel] = useState(existing?.configuration_label ?? "");

  // Configuration Summary
  const [bedsMin, setBedsMin] = useState<number | "">(existing?.beds_min ?? "");
  const [bedsMax, setBedsMax] = useState<number | "">(existing?.beds_max ?? "");
  const [bathsMin, setBathsMin] = useState<number | "">(existing?.baths_min ?? "");
  const [bathsMax, setBathsMax] = useState<number | "">(existing?.baths_max ?? "");
  const [carsMin, setCarsMin] = useState<number | "">(existing?.cars_min ?? "");
  const [carsMax, setCarsMax] = useState<number | "">(existing?.cars_max ?? "");
  const [levels, setLevels] = useState<number | "">(existing?.levels ?? "");
  const [internalSqmMin, setInternalSqmMin] = useState<number | "">(existing?.internal_sqm_min ?? "");
  const [internalSqmMax, setInternalSqmMax] = useState<number | "">(existing?.internal_sqm_max ?? "");
  const [landSizeMin, setLandSizeMin] = useState<number | "">(existing?.land_size_min ?? "");
  const [landSizeMax, setLandSizeMax] = useState<number | "">(existing?.land_size_max ?? "");

  // Property Features
  const [lifestyle, setLifestyle] = useState<string[]>(existing?.lifestyle ?? []);
  const [features, setFeatures] = useState<string[]>(existing?.features ?? []);
  const [architect, setArchitect] = useState(existing?.architect ?? "");
  const [interiors, setInteriors] = useState(existing?.interiors ?? "");
  const [landscape, setLandscape] = useState(existing?.landscape ?? "");
  const [builder, setBuilder] = useState(existing?.builder ?? "");

  // Nearby Amenities
  const [nearbyAmenities, setNearbyAmenities] = useState<string[]>(existing?.nearby_amenities ?? []);

  // Selling Agent
  const [agentName, setAgentName] = useState(existing?.agent_name ?? "");
  const [agentPhone, setAgentPhone] = useState(existing?.agent_phone ?? "");
  const [agentEmail, setAgentEmail] = useState(existing?.agent_email ?? "");
  const [agentAgency, setAgentAgency] = useState(existing?.agent_agency ?? "");

  // Uploads
  const [heroImageUrl, setHeroImageUrl] = useState(existing?.hero_image_url ?? "");
  const [heroAltText, setHeroAltText] = useState(existing?.hero_alt_text ?? "");
  const [featureImageUrl, setFeatureImageUrl] = useState(existing?.feature_image_url ?? "");
  const [brochureUrl, setBrochureUrl] = useState(existing?.brochure_url ?? "");
  const [videoUrl, setVideoUrl] = useState(existing?.video_url ?? "");
  const [agentLogo1, setAgentLogo1] = useState(existing?.agent_logo_1 ?? "");
  const [agentLogo2, setAgentLogo2] = useState(existing?.agent_logo_2 ?? "");

  // Optional Uploads
  const [virtualTourUrl, setVirtualTourUrl] = useState(existing?.virtual_tour_url ?? "");
  const [floorPlanUploadUrl, setFloorPlanUploadUrl] = useState(existing?.floor_plan_upload_url ?? "");
  const [additionalVideoUrl, setAdditionalVideoUrl] = useState(existing?.additional_video_url ?? "");
  const [priceListUrl, setPriceListUrl] = useState(existing?.price_list_url ?? "");
  const [specificationsUrl, setSpecificationsUrl] = useState(existing?.specifications_url ?? "");
  const [gallery, setGallery] = useState<GalleryImage[]>(initialGallery);

  // Mini Stocklist
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>(initialFloorPlans);

  // SEO
  const [seoTitle, setSeoTitle] = useState(existing?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(existing?.seo_description ?? "");

  // Form meta
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function n(v: number | ""): number | null { return v === "" ? null : v; }

  function toggleLifestyle(item: string) {
    setLifestyle((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  }

  // ─── Gallery ─────────────────────────────────────────────────────────────

  async function addGalleryImage(url: string) {
    if (!url) return;
    const res = await fetch("/api/admin/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ development_id: id, url, sort_order: gallery.length }),
    });
    if (res.ok) {
      const json = await res.json();
      setGallery((prev) => [...prev, { id: json.id, url, sort_order: gallery.length }]);
    }
  }

  async function removeGalleryImage(imageId: string) {
    await fetch("/api/admin/gallery", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: imageId }),
    });
    setGallery((prev) => prev.filter((g) => g.id !== imageId));
  }

  // ─── Floor plans ─────────────────────────────────────────────────────────

  function addFloorPlan() {
    setFloorPlans((prev) => [
      ...prev,
      { beds: "", bath: "", garage: "", internal_sqm: "", price_from: "", plan_type: "", config: "", image_url: "" },
    ]);
  }

  function removeFloorPlan(index: number) {
    setFloorPlans((prev) => prev.filter((_, i) => i !== index));
  }

  function updateFloorPlan(index: number, field: keyof FloorPlan, value: string) {
    setFloorPlans((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      _method: isNew ? "POST" : "PATCH",
      id: isNew ? undefined : id,
      // Category
      type: type || null,
      tag: tag || null,
      tier: tier || null,
      // Project Overview
      name,
      slug,
      developer_id: developerId || null,
      developer_website: developerWebsite || null,
      listing_duration: listingDuration || null,
      logo_url: logoUrl || null,
      residence_count: n(residenceCount),
      // Address
      street_address: streetAddress || null,
      street_address_2: streetAddress2 || null,
      country: country || null,
      state: state || null,
      city: city || null,
      postcode: postcode || null,
      suburb: suburb || null,
      location_description: locationDescription || null,
      // Sale office
      sale_office_street: saleOfficeStreet || null,
      sale_office_street_2: saleOfficeStreet2 || null,
      sale_office_country: saleOfficeCountry || null,
      sale_office_state: saleOfficeState || null,
      sale_office_city: saleOfficeCity || null,
      sale_office_postcode: saleOfficePostcode || null,
      // Details
      display_suite_timing: displaySuiteTiming || null,
      description: description || null,
      summary: description || null,
      status,
      is_published: isPublished,
      is_featured: isFeatured,
      lat: n(lat),
      lng: n(lng),
      // Pricing
      price_from: n(priceFrom),
      search_price_max: n(searchPriceMax),
      price_display: priceDisplay || null,
      show_price_on_search: showPriceOnSearch,
      promotional_banner: promotionalBanner || null,
      completion_quarter: completionQuarter || null,
      configuration_label: configurationLabel || null,
      // Configuration
      beds_min: n(bedsMin),
      beds_max: n(bedsMax),
      baths_min: n(bathsMin),
      baths_max: n(bathsMax),
      cars_min: n(carsMin),
      cars_max: n(carsMax),
      levels: n(levels),
      internal_sqm_min: n(internalSqmMin),
      internal_sqm_max: n(internalSqmMax),
      land_size_min: n(landSizeMin),
      land_size_max: n(landSizeMax),
      // Features
      lifestyle: lifestyle.length ? lifestyle : null,
      features: features.length ? features : null,
      architect: architect || null,
      interiors: interiors || null,
      landscape: landscape || null,
      builder: builder || null,
      nearby_amenities: nearbyAmenities.length ? nearbyAmenities : null,
      // Agent
      agent_name: agentName || null,
      agent_phone: agentPhone || null,
      agent_email: agentEmail || null,
      agent_agency: agentAgency || null,
      // Uploads
      hero_image_url: heroImageUrl || null,
      hero_alt_text: heroAltText || null,
      feature_image_url: featureImageUrl || null,
      brochure_url: brochureUrl || null,
      video_url: videoUrl || null,
      agent_logo_1: agentLogo1 || null,
      agent_logo_2: agentLogo2 || null,
      virtual_tour_url: virtualTourUrl || null,
      floor_plan_upload_url: floorPlanUploadUrl || null,
      additional_video_url: additionalVideoUrl || null,
      price_list_url: priceListUrl || null,
      specifications_url: specificationsUrl || null,
      // SEO
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      // Floor plans
      floor_plans: floorPlans,
    };

    const res = await fetch("/api/admin/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Something went wrong. Please try again.");
      setSaving(false);
      return;
    }

    router.push("/admin/listings");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${existing?.name ?? "this listing"}"? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch("/api/admin/listings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Delete failed.");
      setDeleting(false);
      return;
    }
    router.push("/admin/listings");
    router.refresh();
  }

  // ─── Shared styles ────────────────────────────────────────────────────────

  const inp = "w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md text-ink outline-none focus:border-orange/60 transition-colors";
  const lbl = "section-label block mb-1.5";
  const g2 = "grid grid-cols-2 gap-4";
  const g3 = "grid grid-cols-3 gap-4";
  const g4 = "grid grid-cols-4 gap-4";
  const g5 = "grid grid-cols-5 gap-4";
  const smallInp = "w-full border border-line px-2 py-1.5 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 transition-colors";

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      <Link
        href="/admin/listings"
        className="inline-flex items-center gap-1.5 font-mono text-label-sm uppercase tracking-widest text-ink/40 hover:text-orange transition-colors mb-6"
      >
        ← Back to Listings
      </Link>

      <h1 className="font-display font-light text-navy text-section-lg mb-8">
        {isNew ? "New listing" : `Edit: ${existing?.name}`}
      </h1>

      {error && (
        <p className="mb-6 font-sans text-body-md text-red-600 bg-red-50 border border-red-200 px-4 py-3">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">

        {/* ── 1. Category ─────────────────────────────────────────────────── */}
        <AccordionSection title="Category" defaultOpen>
          <div className={g2}>
            <div>
              <label className={lbl}>Listing Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className={inp + " cursor-pointer"}>
                <option value="">— Select type —</option>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Tag</label>
              <input type="text" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. New Release" className={inp} />
            </div>
            <div>
              <label className={lbl}>Tier</label>
              <select value={tier} onChange={(e) => setTier(e.target.value)} className={inp + " cursor-pointer"}>
                <option value="">— No tier —</option>
                <option value="1st Tier">1st Tier</option>
                <option value="2nd Tier">2nd Tier</option>
              </select>
            </div>
          </div>
        </AccordionSection>

        {/* ── 2. Project Overview ──────────────────────────────────────────── */}
        <AccordionSection title="Project Overview" defaultOpen={isNew}>

          {/* Row 1: name + listing duration */}
          <div className={g2}>
            <div>
              <label className={lbl}>Project Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inp} />
            </div>
            <div>
              <label className={lbl}>Listing Duration</label>
              <select value={listingDuration} onChange={(e) => setListingDuration(e.target.value)} className={inp + " cursor-pointer"}>
                <option value="">— Select —</option>
                {LISTING_DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: developer + website + number of residences */}
          <div className={`${g3} mt-4`}>
            <div>
              <label className={lbl}>Project By (Developer)</label>
              <select value={developerId} onChange={(e) => setDeveloperId(e.target.value)} className={inp + " cursor-pointer"}>
                <option value="">— No developer —</option>
                {developers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Developer Website URL</label>
              <input type="url" value={developerWebsite} onChange={(e) => setDeveloperWebsite(e.target.value)} placeholder="https://..." className={inp} />
            </div>
            <div>
              <label className={lbl}>Number of Apartments / Lots</label>
              <input type="number" value={residenceCount} onChange={(e) => setResidenceCount(e.target.value === "" ? "" : Number(e.target.value))} className={inp} />
            </div>
          </div>

          {/* Project logo */}
          <div className="mt-5">
            <ImageUpload label="Project Logo" value={logoUrl} onChange={setLogoUrl} bucket="development-images" />
          </div>

          {/* URL slug */}
          <div className="mt-4">
            <label className={lbl}>URL Slug *</label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required className={inp + " font-mono text-label-lg"} />
          </div>

          {/* ── Address ── */}
          <SectionDivider label="Address" />
          <div className={`${g4} mb-4`}>
            <div>
              <label className={lbl}>Street Address *</label>
              <input type="text" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="e.g. 35" className={inp} />
            </div>
            <div>
              <label className={lbl}>Street Address 2 *</label>
              <input type="text" value={streetAddress2} onChange={(e) => setStreetAddress2(e.target.value)} placeholder="e.g. Northumberland Road" className={inp} />
            </div>
            <div>
              <label className={lbl}>Suburb</label>
              <input type="text" value={suburb} onChange={(e) => setSuburb(e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>City</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>State</label>
              <select value={state} onChange={(e) => setState(e.target.value)} className={inp + " cursor-pointer"}>
                <option value="">Select</option>
                {AU_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>PostCode</label>
              <input type="text" value={postcode} onChange={(e) => setPostcode(e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Country</label>
              <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Australia" className={inp} />
            </div>
          </div>
          <div>
            <label className={lbl}>Location Description</label>
            <textarea rows={3} value={locationDescription} onChange={(e) => setLocationDescription(e.target.value)} className={inp + " resize-none"} />
          </div>

          {/* ── Sale Office Address ── */}
          <SectionDivider label="Sale Office Address (if different to above)" />
          <div className={g4}>
            <div>
              <label className={lbl}>Street Address</label>
              <input type="text" value={saleOfficeStreet} onChange={(e) => setSaleOfficeStreet(e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Street Address 2</label>
              <input type="text" value={saleOfficeStreet2} onChange={(e) => setSaleOfficeStreet2(e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>City</label>
              <input type="text" value={saleOfficeCity} onChange={(e) => setSaleOfficeCity(e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>State</label>
              <select value={saleOfficeState} onChange={(e) => setSaleOfficeState(e.target.value)} className={inp + " cursor-pointer"}>
                <option value="">Select</option>
                {AU_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>PostCode</label>
              <input type="text" value={saleOfficePostcode} onChange={(e) => setSaleOfficePostcode(e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Country</label>
              <input type="text" value={saleOfficeCountry} onChange={(e) => setSaleOfficeCountry(e.target.value)} placeholder="Australia" className={inp} />
            </div>
          </div>

          {/* ── Timing & Description ── */}
          <SectionDivider label="Listing Details" />
          <div className="mb-4">
            <label className={lbl}>Display Suite Timing</label>
            <textarea
              rows={2}
              value={displaySuiteTiming}
              onChange={(e) => setDisplaySuiteTiming(e.target.value)}
              placeholder="e.g. Monday to Sunday 10am – 6pm"
              className={inp + " resize-none"}
            />
          </div>
          <div className="mb-4">
            <label className={lbl}>Brief Description *</label>
            <textarea
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a detailed description of the project…"
              className={inp + " resize-y"}
            />
          </div>

          {/* ── Pricing & dates ── */}
          <SectionDivider label="Pricing &amp; Dates" />
          <div className={`${g5} mb-4`}>
            <div>
              <label className={lbl}>Search Price Minimum ($) *</label>
              <input type="number" value={priceFrom} onChange={(e) => setPriceFrom(e.target.value === "" ? "" : Number(e.target.value))} placeholder="450000" className={inp} />
            </div>
            <div>
              <label className={lbl}>Search Price Maximum ($) *</label>
              <input type="number" value={searchPriceMax} onChange={(e) => setSearchPriceMax(e.target.value === "" ? "" : Number(e.target.value))} placeholder="1275000" className={inp} />
            </div>
            <div>
              <label className={lbl}>Completion Date *</label>
              <input type="text" value={completionQuarter} onChange={(e) => setCompletionQuarter(e.target.value)} placeholder="e.g. Q1 2028" className={inp} />
            </div>
            <div>
              <label className={lbl}>Lead In Pricing</label>
              <input type="text" value={priceDisplay} onChange={(e) => setPriceDisplay(e.target.value)} placeholder="e.g. From $650,000" className={inp} />
            </div>
            <div>
              <label className={lbl}>Promotional Banner</label>
              <input type="text" value={promotionalBanner} onChange={(e) => setPromotionalBanner(e.target.value)} placeholder="e.g. 2 BED FI $775,000" className={inp} />
            </div>
          </div>
          <div className="mb-4">
            <label className={lbl}>
              Configuration{" "}
              <span className="font-sans text-xs text-ink/40 font-normal">(max 25 characters)</span>
            </label>
            <input
              type="text"
              value={configurationLabel}
              onChange={(e) => setConfigurationLabel(e.target.value.slice(0, 25))}
              placeholder="e.g. 1, 2 & 3 Bedrooms"
              maxLength={25}
              className={inp}
            />
            <p className="font-mono text-label-sm text-ink/30 mt-1">
              {configurationLabel.length} / 25 chars
            </p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input type="checkbox" checked={showPriceOnSearch} onChange={(e) => setShowPriceOnSearch(e.target.checked)} className="w-4 h-4 accent-orange" />
            <span className="section-label">Display price on search results</span>
          </label>

          {/* ── Visibility ── */}
          <SectionDivider label="Visibility &amp; Location" />
          <div className={`${g2} mb-4`}>
            <div>
              <label className={lbl}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inp + " cursor-pointer"}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-3 mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="w-4 h-4 accent-orange" />
              <span className="section-label">Published (visible on site)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-4 h-4 accent-orange" />
              <span className="section-label">Featured on homepage</span>
            </label>
          </div>
          <div className={g2}>
            <div>
              <label className={lbl}>Latitude</label>
              <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. -33.8688" className={inp} />
            </div>
            <div>
              <label className={lbl}>Longitude</label>
              <input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 151.2093" className={inp} />
            </div>
          </div>
          <p className="font-sans text-xs text-ink/40 mt-2">
            Tip: right-click any location in Google Maps → copy the coordinates shown at the top.
          </p>
        </AccordionSection>

        {/* ── 3. Configuration Summary ─────────────────────────────────────── */}
        <AccordionSection title="Configuration Summary">
          {isNew ? (
            <p className="font-sans text-sm text-ink/40 italic">Save the listing first to add unit configurations.</p>
          ) : (
            <div>
              {floorPlans.length > 0 && (
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b-2 border-orange/20">
                        {["Beds", "Bath", "Garage", "Total Size (sqm)", "Price From ($)", "Action"].map((h) => (
                          <th key={h} className="font-sans text-sm font-semibold text-ink/70 px-4 py-3 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {floorPlans.map((fp, i) => (
                        <tr key={i} className="border-b border-line last:border-0">
                          <td className="px-4 py-3">
                            <input type="number" value={fp.beds} onChange={(e) => updateFloorPlan(i, "beds", e.target.value)} placeholder="1" className="border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 w-20" />
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" value={fp.bath} onChange={(e) => updateFloorPlan(i, "bath", e.target.value)} placeholder="1" className="border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 w-20" />
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" value={fp.garage} onChange={(e) => updateFloorPlan(i, "garage", e.target.value)} placeholder="1" className="border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 w-20" />
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" value={fp.internal_sqm} onChange={(e) => updateFloorPlan(i, "internal_sqm", e.target.value)} placeholder="75" className="border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 w-28" />
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" value={fp.price_from} onChange={(e) => updateFloorPlan(i, "price_from", e.target.value)} placeholder="650000" className="border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 w-32" />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => removeFloorPlan(i)}
                              className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-red-300 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <button
                type="button"
                onClick={addFloorPlan}
                className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors mr-2"
              >
                + Add
              </button>
              <p className="font-sans text-xs text-ink/40 mt-3">
                Changes save when you click <strong>Save changes</strong> at the bottom of the form.
              </p>
            </div>
          )}
        </AccordionSection>

        {/* ── 4. Property Features ─────────────────────────────────────────── */}
        <AccordionSection title="Property Features">
          <p className="font-sans text-sm text-ink/50 mb-4">
            ( At least select one property feature is required ){" "}
            <span className="text-red-500">*</span>
          </p>
          <div className="grid grid-cols-3 gap-y-3 gap-x-4">
            {LIFESTYLE_OPTIONS.map((item) => (
              <label key={item} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lifestyle.includes(item)}
                  onChange={() => toggleLifestyle(item)}
                  className="w-4 h-4 accent-orange flex-shrink-0"
                />
                <span className="font-sans text-sm text-ink/80">{item}</span>
              </label>
            ))}
          </div>
          <AddYourOwn lifestyle={lifestyle} setLifestyle={setLifestyle} />
        </AccordionSection>

        {/* ── 5. Nearby Amenities ──────────────────────────────────────────── */}
        <AccordionSection title="Nearby Amenities">
          <p className="font-sans text-xs text-ink/40 mb-3">
            Add schools, transport, shopping centres, parks — anything nearby.
          </p>
          <TagInput value={nearbyAmenities} onChange={setNearbyAmenities} placeholder="e.g. Melbourne Central Station" />
        </AccordionSection>

        {/* ── 6. Selling Agent(s) / Contact Details ────────────────────────── */}
        <AccordionSection title="Selling Agent(s) / Contact Details">
          {isNew ? (
            <p className="font-sans text-sm text-ink/40 italic">
              Save the listing first to add selling agents.
            </p>
          ) : (
            <AgentManager developmentId={id} initialAgents={agents} />
          )}
        </AccordionSection>

        {/* ── 7. Uploads ───────────────────────────────────────────────────── */}
        <AccordionSection title="Uploads">
          {/* Main Photo */}
          <SingleUpload
            label="Main Photo Upload *"
            hint="(File size: up to 10MB, Dimensions: 1920×1080)"
            value={heroImageUrl}
            onChange={setHeroImageUrl}
            altText={heroAltText}
            onAltTextChange={setHeroAltText}
          />

          {/* Homepage Feature Image */}
          <SingleUpload
            label="Homepage Feature Image"
            hint="(File size: up to 5MB, Dimensions: 500×500) (This is applicable to premier listings only)"
            value={featureImageUrl}
            onChange={setFeatureImageUrl}
          />

          {/* Gallery */}
          {isNew ? (
            <div className="border-b border-line pb-5 mb-5">
              <p className="font-sans text-sm font-medium text-ink/80 mb-1">Gallery Images</p>
              <p className="font-sans text-sm text-ink/40 italic">Save the listing first to add gallery images.</p>
            </div>
          ) : (
            <GalleryManager gallery={gallery} onAdd={addGalleryImage} onRemove={removeGalleryImage} />
          )}

          {/* Video Link */}
          <div className="mb-5">
            <label className="font-sans text-sm text-ink/70 block mb-2">Video Link:</label>
            <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/..." className={inp} />
          </div>

          {/* Selling Agent Logos */}
          <div className={g2}>
            <SingleUpload
              label="Selling Agent's Logo -1"
              hint="(Image size up to 5MB)"
              value={agentLogo1}
              onChange={setAgentLogo1}
            />
            <SingleUpload
              label="Selling Agent's Logo -2"
              hint="(Image size up to 5MB)"
              value={agentLogo2}
              onChange={setAgentLogo2}
            />
          </div>
        </AccordionSection>

        {/* ── 8. Optional Uploads ──────────────────────────────────────────── */}
        <AccordionSection title="Optional Uploads">
          {/* Upload floor plans */}
          <SingleUpload
            label="Upload floor plans"
            hint="(File size: up to 10MB)"
            value={floorPlanUploadUrl}
            onChange={setFloorPlanUploadUrl}
            accept="image/jpeg,image/png,image/webp,application/pdf"
          />

          {/* Upload Additional Video */}
          <div className="border-b border-line pb-5 mb-5">
            <p className="font-sans text-sm font-medium text-ink/80 mb-2">Upload Additional Video</p>
            <div className="flex gap-2">
              <input
                type="url"
                value={additionalVideoUrl}
                onChange={(e) => setAdditionalVideoUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                className={inp}
              />
              <button
                type="button"
                onClick={() => setAdditionalVideoUrl("")}
                className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors whitespace-nowrap"
              >
                + Add
              </button>
              <button
                type="button"
                className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-teal-400 text-teal-600 hover:bg-teal-500 hover:text-white transition-colors whitespace-nowrap"
              >
                Save
              </button>
            </div>
          </div>

          {/* 3D Tour Link */}
          <div className="border-b border-line pb-5 mb-5">
            <p className="font-sans text-sm font-medium text-ink/80 mb-2">3D Tour Link</p>
            <p className="font-sans text-xs text-ink/40 mb-2">
              If using a video that is already online, you can insert the URL here.
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                value={virtualTourUrl}
                onChange={(e) => setVirtualTourUrl(e.target.value)}
                placeholder="https://..."
                className={inp}
              />
              <button
                type="button"
                onClick={() => setVirtualTourUrl("")}
                className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors whitespace-nowrap"
              >
                + Add
              </button>
              <button
                type="button"
                className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-teal-400 text-teal-600 hover:bg-teal-500 hover:text-white transition-colors whitespace-nowrap"
              >
                Save
              </button>
            </div>
          </div>

          {/* Price List */}
          <SingleUpload
            label="Price List"
            hint="(File size: up to 10MB)"
            value={priceListUrl}
            onChange={setPriceListUrl}
            accept="image/jpeg,image/png,image/webp,application/pdf"
          />

          {/* Brochure */}
          <SingleUpload
            label="Brochure"
            hint="(File size: up to 10MB)"
            value={brochureUrl}
            onChange={setBrochureUrl}
            accept="image/jpeg,image/png,image/webp,application/pdf"
          />

          {/* Specifications */}
          <SingleUpload
            label="Specifications"
            hint="(File size: up to 10MB)"
            value={specificationsUrl}
            onChange={setSpecificationsUrl}
            accept="image/jpeg,image/png,image/webp,application/pdf"
          />
        </AccordionSection>

        {/* ── 9. Mini Stocklist (Optional) ─────────────────────────────────── */}
        <AccordionSection title="Mini Stocklist (Optional)">
          {isNew ? (
            <p className="font-sans text-sm text-ink/40 italic">Save the listing first to add unit entries.</p>
          ) : (
            <div>
              {floorPlans.map((fp, i) => (
                <div key={i} className="border border-line mb-4 p-4 bg-white">
                  <div className={`${g3} mb-4`}>
                    <div>
                      <label className={lbl}>Number Of Bedrooms</label>
                      <input
                        type="number"
                        value={fp.beds}
                        onChange={(e) => updateFloorPlan(i, "beds", e.target.value)}
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Number Of Bathrooms</label>
                      <input
                        type="number"
                        value={fp.bath}
                        onChange={(e) => updateFloorPlan(i, "bath", e.target.value)}
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Parking Spaces</label>
                      <input
                        type="number"
                        value={fp.garage}
                        onChange={(e) => updateFloorPlan(i, "garage", e.target.value)}
                        className={inp}
                      />
                    </div>
                  </div>
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className={lbl}>Total Apartment Size</label>
                      <input
                        type="number"
                        value={fp.internal_sqm}
                        onChange={(e) => updateFloorPlan(i, "internal_sqm", e.target.value)}
                        className={inp}
                      />
                    </div>
                    <div className="flex-1">
                      <label className={lbl}>Price From</label>
                      <input
                        type="number"
                        value={fp.price_from}
                        onChange={(e) => updateFloorPlan(i, "price_from", e.target.value)}
                        className={inp}
                      />
                    </div>
                    <div className="flex-shrink-0 pb-0.5">
                      <button
                        type="button"
                        onClick={() => removeFloorPlan(i)}
                        className="font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 border border-red-400 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addFloorPlan}
                  className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors"
                >
                  + Add
                </button>
              </div>
              <p className="font-sans text-xs text-ink/40 mt-3">
                Changes save when you click <strong>Save changes</strong> at the bottom of the form.
              </p>
            </div>
          )}
        </AccordionSection>

        {/* ── 10. SEO ──────────────────────────────────────────────────────── */}
        <AccordionSection title="SEO">
          <div className="flex flex-col gap-4">
            <div>
              <label className="font-sans text-sm text-ink/70 block mb-1.5">Page Title:</label>
              <input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="e.g. Luxury Apartments in Melbourne CBD | ProjectName" className={inp} />
            </div>
            <div>
              <label className="font-sans text-sm text-ink/70 block mb-1.5">Meta Description:</label>
              <textarea rows={8} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="150–160 character description for search engines…" className={inp + " resize-none"} />
            </div>
          </div>
        </AccordionSection>

        {/* ── Form actions ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex gap-3">
            <Link
              href="/admin/listings"
              className="font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 border border-orange text-orange hover:bg-orange hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              ← Back
            </Link>
            <button type="submit" disabled={saving || deleting} className="font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 border border-orange text-orange hover:bg-orange hover:text-white transition-colors disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
            {!isNew && existing?.slug && (
              <Link
                href={`/listings/${existing.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 border border-orange text-orange hover:bg-orange hover:text-white transition-colors"
              >
                Preview
              </Link>
            )}
          </div>
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="font-mono text-label-sm uppercase tracking-widest px-4 py-2 border border-red-300 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete listing"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
