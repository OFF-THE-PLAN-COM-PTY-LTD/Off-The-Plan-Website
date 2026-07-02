"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/admin/image-upload";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { featuresForCategory } from "@/lib/category-features";
import { getCardFields, getStocklistFields } from "@/lib/listing-card-fields";

/**
 * Wrap plain text in <p>/<br> tags so it's safe to load into a TipTap editor
 * that expects HTML. Existing listings stored their description as raw text;
 * this keeps that data viewable + editable once we switch to a rich editor.
 */
function plainTextToHtml(raw: string): string {
  if (!raw) return "";
  if (/<(p|div|br|ul|ol|h[1-6])\b/i.test(raw)) return raw;
  return raw
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, "<br>")}</p>`)
    .filter((p) => p !== "<p></p>")
    .join("");
}

/** Strip tags for the plain-text companion field. */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>(\r\n|\n)?/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Developer { id: string; name: string }
interface Member { id: string; full_name: string | null; interest_type: string | null }
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
  // Land Estates fields — empty string for categories that don't use them.
  lot_number: string;
  land_area_sqm: string;
  frontage_m: string;
  depth_m: string;
  // House and Land fields — empty string for categories that don't use them.
  house_size_sqm: string;
  land_size_sqm: string;
  // Commercial fields — empty string for non-Commercial categories.
  floor_area_sqm: string;
  level: string;
  unit_suite_no: string;
  property_sub_type: string;
}

// Mini stocklist row — every cell stays a free-text string so admins
// can enter things like "Contact Agent" or "Fr. $660,000" verbatim,
// matching what Tim's existing site allows.
interface MiniStocklistEntry {
  bed: string;
  bath: string;
  parking: string;
  size: string;
  price: string;
  // Land Estates fields — empty string for non-LE categories.
  lot_number?: string;
  land_area?: string;
  frontage?: string;
  depth?: string;
  // House and Land fields — empty string for non-H&L categories.
  house_size?: string;
  land_size?: string;
  // Commercial fields — empty string for non-Commercial categories.
  floor_area?: string;
  level?: string;
  unit_suite_no?: string;
  property_sub_type?: string;
}
const MAX_STOCKLIST_ROWS = 20;
const MAX_CONFIG_SUMMARY_ROWS = 4;

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
  portal_developer_name?: string | null;
  owner_user_id?: string | null;
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
  description_html?: string;
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
  // Mini stocklist — see MiniStocklistEntry above. Up to 20 rows.
  mini_stocklist?: MiniStocklistEntry[] | null;
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
  members: Member[];
  gallery: GalleryImage[];
  floorPlans: FloorPlan[];
  agents: Omit<Agent, "isNew" | "saving" | "deleting">[];
  isPortal?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const AU_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

const TYPES = [
  "Apartment", "House & Land", "Townhouse", "Villa",
  "Land", "Commercial", "Mixed Use",
];

const PORTAL_TYPES = [
  "New Apartments", "Townhouses", "Land and Estates",
  "Commercial", "House & Land",
  "Over 55's / Retirement",
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
        <span className="font-mono text-[11px] uppercase tracking-widest text-orange font-bold">
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

/**
 * Click-to-open hint that explains where a given input surfaces on the public
 * listing card. Used next to fields the client flagged as confusing during
 * the June 1-7 testing round.
 */
function ExampleHint({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="font-sans text-xs text-orange underline underline-offset-2 hover:text-orange/80 ml-2"
      >
        (View Example)
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute left-0 top-full mt-2 z-50 w-[440px] max-w-[90vw] bg-white border-2 border-orange shadow-xl rounded-sm p-4 text-left">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h4 className="font-sans font-semibold text-sm text-ink">{title}</h4>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-ink/40 hover:text-ink text-xl leading-none -mt-1"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="font-sans text-sm text-ink/70 space-y-3">{children}</div>
          </div>
        </>
      )}
    </span>
  );
}

/**
 * Tiny mock of a listing card used inside ExampleHint popovers. Highlights
 * the input being explained by wrapping it in <mark>.
 */
function CardPreview({ highlight }: { highlight: "price" | "config" | "summary" }) {
  return (
    <div className="border border-line bg-cream-alt p-3 font-sans text-xs">
      <p className="text-[9px] uppercase tracking-widest text-ink/40 mb-2">Listing card preview</p>
      <div className="bg-white p-3 border border-line">
        <p className="font-semibold text-ink">Sample Project · Suburb NSW</p>
        <p className="text-ink/60 text-[11px] mb-2">
          Price Guide: {highlight === "price"
            ? <mark className="bg-yellow-200 px-1">From $650,000</mark>
            : <span>From $650,000</span>}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-orange mb-2">
          New Apartments {highlight === "config" && <mark className="bg-yellow-200 px-1 normal-case font-sans tracking-normal">· 1, 2 &amp; 3 Bedrooms</mark>}
        </p>
        <div className={`flex gap-3 text-[11px] text-ink ${highlight === "summary" ? "bg-yellow-200 p-1 -mx-1" : ""}`}>
          <span>🛏 3</span><span>🛁 2</span><span>🚗 2</span><span>↔ 185</span>
        </div>
      </div>
    </div>
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
  standardOptions = LIFESTYLE_OPTIONS,
}: {
  lifestyle: string[];
  setLifestyle: React.Dispatch<React.SetStateAction<string[]>>;
  /**
   * Features considered "standard" — anything in `lifestyle` not in this
   * list is treated as user-added and shown in the custom section.
   * Defaults to the residential list (LIFESTYLE_OPTIONS) for back-compat
   * but should be passed the current category's feature list when known.
   */
  standardOptions?: string[];
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

  const custom = lifestyle.filter((item) => !standardOptions.includes(item));

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
  onReorder,
}: {
  gallery: GalleryImage[];
  onAdd: (url: string) => void;
  onRemove: (id: string) => void;
  onReorder: (reordered: GalleryImage[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  async function uploadSingle(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "development-images");
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    if (!res.ok) return null;
    const json = await res.json();
    return typeof json.url === "string" ? json.url : null;
  }

  /**
   * Accepts a batch of files. Trims to remaining capacity (20-image cap),
   * uploads them sequentially so we don't overwhelm the API, and reports
   * progress for each one.
   */
  async function uploadImages(files: File[]) {
    setUploadError(null);
    const remainingCapacity = Math.max(0, 20 - gallery.length);
    if (remainingCapacity === 0) {
      setUploadError("Maximum 20 images reached.");
      return;
    }
    const toUpload = files.slice(0, remainingCapacity);
    const skipped = files.length - toUpload.length;

    setUploading(true);
    setUploadProgress({ done: 0, total: toUpload.length });

    let failed = 0;
    for (let i = 0; i < toUpload.length; i++) {
      const url = await uploadSingle(toUpload[i]);
      if (url) onAdd(url);
      else failed += 1;
      setUploadProgress({ done: i + 1, total: toUpload.length });
    }

    setUploading(false);
    setUploadProgress(null);
    if (failed > 0 || skipped > 0) {
      const parts: string[] = [];
      if (failed > 0) parts.push(`${failed} upload${failed === 1 ? "" : "s"} failed`);
      if (skipped > 0) parts.push(`${skipped} skipped (20-image cap)`);
      setUploadError(parts.join(" · "));
    }
  }

  function handleDragStart(i: number) {
    dragIndex.current = i;
  }

  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    setDragOverIndex(i);
  }

  async function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null || from === dropIndex) {
      setDragOverIndex(null);
      return;
    }
    const reordered = [...gallery];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(dropIndex, 0, moved);
    const withOrder = reordered.map((img, idx) => ({ ...img, sort_order: idx }));
    onReorder(withOrder);
    dragIndex.current = null;
    setDragOverIndex(null);
    await fetch("/api/admin/gallery", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates: withOrder.map(({ id, sort_order }) => ({ id, sort_order })) }),
    });
  }

  function handleDragEnd() {
    dragIndex.current = null;
    setDragOverIndex(null);
  }

  return (
    <div className="border-b border-line pb-5 mb-5">
      <div className="flex items-start gap-8">
        {/* Left: upload controls */}
        <div className="flex-shrink-0 w-72">
          <p className="font-sans text-sm font-medium text-ink/80 mb-2">
            Select up to 20 images ({gallery.length}/20)
          </p>
          <div className="flex items-center gap-3 mb-1.5">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length > 0) uploadImages(files);
                e.target.value = "";
              }}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading || gallery.length >= 20}
              className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {uploading
                ? uploadProgress
                  ? `Uploading ${uploadProgress.done}/${uploadProgress.total}…`
                  : "Uploading…"
                : "Select Files"}
            </button>
            {!uploading && <span className="font-sans text-sm text-ink/40">Choose one or more</span>}
          </div>
          <p className="font-sans text-xs text-ink/40">Hold Shift or Ctrl/Cmd in the file picker to select multiple at once.</p>
          <p className="font-sans text-xs text-ink/40">(File size: up to 10MB each, Dimensions: 1920×1080)</p>
          {uploadError && (
            <p className="font-sans text-xs text-orange mt-1">{uploadError}</p>
          )}
          {gallery.length >= 20 && !uploadError && (
            <p className="font-sans text-xs text-orange mt-1">Maximum 20 images reached.</p>
          )}
        </div>

        {/* Right: draggable numbered list */}
        {gallery.length > 0 && (
          <div className="flex-1">
            <p className="font-sans text-sm text-orange mb-3">
              Click and drag images to change their order
            </p>
            <div className="flex flex-col gap-1">
              {gallery.map((img, i) => {
                const filename = img.url.split("/").pop() ?? img.url;
                const isDragOver = dragOverIndex === i;
                return (
                  <div
                    key={img.id}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDrop={(e) => handleDrop(e, i)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 px-2 py-1.5 rounded cursor-grab active:cursor-grabbing transition-colors select-none ${
                      isDragOver ? "bg-orange/10 border border-orange/40" : "hover:bg-cream/60 border border-transparent"
                    }`}
                  >
                    <span className="font-sans text-sm text-ink/40 w-5 flex-shrink-0 text-right">{i + 1}.</span>
                    {/* Drag handle */}
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-ink/30 flex-shrink-0">
                      <circle cx="4" cy="2" r="1.2"/><circle cx="8" cy="2" r="1.2"/>
                      <circle cx="4" cy="6" r="1.2"/><circle cx="8" cy="6" r="1.2"/>
                      <circle cx="4" cy="10" r="1.2"/><circle cx="8" cy="10" r="1.2"/>
                    </svg>
                    <div className="relative w-10 h-10 overflow-hidden bg-navy/5 flex-shrink-0">
                      <Image src={img.url} alt="" fill className="object-cover" sizes="40px" />
                    </div>
                    <a
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-sans text-sm text-orange hover:underline truncate flex-1 max-w-xs"
                    >
                      {filename}
                    </a>
                    <button
                      type="button"
                      onClick={() => onRemove(img.id)}
                      className="text-red-400 hover:text-red-600 flex-shrink-0"
                      title="Remove image"
                    >
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
  members,
  gallery: initialGallery,
  floorPlans: initialFloorPlans,
  agents,
  isPortal = false,
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
  const [portalDeveloperName, setPortalDeveloperName] = useState(existing?.portal_developer_name ?? "");
  const [ownerUserId, setOwnerUserId] = useState(existing?.owner_user_id ?? "");
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
  const [description, setDescription] = useState(
    existing?.description_html ?? plainTextToHtml(existing?.description ?? existing?.summary ?? ""),
  );
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

  // "Properties Available" table — separate from floor_plans. Free-text
  // cells so an admin can enter "Contact Agent" or "Fr. $660,000" the
  // same way Tim's existing site allows. Capped at 20 rows.
  const [miniStocklist, setMiniStocklist] = useState<MiniStocklistEntry[]>(
    Array.isArray(existing?.mini_stocklist)
      ? (existing!.mini_stocklist as MiniStocklistEntry[])
      : [],
  );

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

  function reorderGallery(reordered: GalleryImage[]) {
    setGallery(reordered);
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
    setFloorPlans((prev) =>
      prev.length >= MAX_CONFIG_SUMMARY_ROWS
        ? prev
        : [...prev, { beds: "", bath: "", garage: "", internal_sqm: "", price_from: "", plan_type: "", config: "", image_url: "", lot_number: "", land_area_sqm: "", frontage_m: "", depth_m: "", house_size_sqm: "", land_size_sqm: "", floor_area_sqm: "", level: "", unit_suite_no: "", property_sub_type: "" }],
    );
  }

  function removeFloorPlan(index: number) {
    setFloorPlans((prev) => prev.filter((_, i) => i !== index));
  }

  function updateFloorPlan(index: number, field: keyof FloorPlan, value: string) {
    setFloorPlans((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  }

  // ─── Mini Stocklist (Properties Available) ────────────────────────────────

  function addStocklistRow() {
    setMiniStocklist((prev) =>
      prev.length >= MAX_STOCKLIST_ROWS
        ? prev
        : [...prev, { bed: "", bath: "", parking: "", size: "", price: "", lot_number: "", land_area: "", frontage: "", depth: "", house_size: "", land_size: "", floor_area: "", level: "", unit_suite_no: "", property_sub_type: "" }],
    );
  }

  function removeStocklistRow(index: number) {
    setMiniStocklist((prev) => prev.filter((_, i) => i !== index));
  }

  function updateStocklistRow(index: number, field: keyof MiniStocklistEntry, value: string) {
    setMiniStocklist((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  function buildPayload() {
    return {
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
      portal_developer_name: portalDeveloperName || null,
      owner_user_id: ownerUserId || null,
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
      description_html: description || null,
      description: description ? htmlToPlainText(description) || null : null,
      summary: description ? htmlToPlainText(description) || null : null,
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
      // Mini stocklist — only send rows where the user typed something
      // so empty drafts don't leak through.
      mini_stocklist: miniStocklist.filter(
        (r) => r.bed || r.bath || r.parking || r.size || r.price || r.lot_number || r.land_area || r.frontage || r.depth || r.house_size || r.land_size || r.floor_area || r.level || r.unit_suite_no || r.property_sub_type,
      ),
    };
  }

  // ── Autosave (2026-07-02) ──────────────────────────────────────────────
  // Compute a fingerprint of the current form state on every render. Then a
  // debounced effect (below) checks if it has drifted from what's on the
  // server and silently PATCHes if so. This preserves in-progress work when
  // a member starts a listing, wanders off to another tab, and comes back.
  //
  // Uses the same /api/admin/listings endpoint as the explicit Save button;
  // just doesn't redirect afterwards. Errors are logged and shown as a small
  // "Save failed" hint next to the Save button — they don't block the form.
  //
  // Skipped for new listings (isNew) because there's no id to PATCH yet;
  // the draft-first flow means the edit page always has an id anyway.
  const currentFingerprint = JSON.stringify(buildPayload());
  const lastSavedFingerprintRef = useRef<string>("");
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  // Track the mounted-since-render timestamp so we can skip the initial
  // "state is identical to props" state and only autosave real user changes.
  const mountedRef = useRef(false);

  useEffect(() => {
    // On first render, seed the ref with the initial fingerprint so we
    // don't autosave the untouched form.
    if (!mountedRef.current) {
      lastSavedFingerprintRef.current = currentFingerprint;
      mountedRef.current = true;
      return;
    }
    if (isNew || saving) return;
    if (currentFingerprint === lastSavedFingerprintRef.current) return;

    const timer = setTimeout(async () => {
      setAutoSaveStatus("saving");
      try {
        const res = await fetch("/api/admin/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: currentFingerprint,
        });
        if (!res.ok) {
          setAutoSaveStatus("error");
          return;
        }
        lastSavedFingerprintRef.current = currentFingerprint;
        setAutoSaveStatus("saved");
        // Fade the "Saved" pill back to idle after a moment so it doesn't
        // sit there stale after inactivity.
        setTimeout(() => setAutoSaveStatus("idle"), 2500);
      } catch (err) {
        console.error("Autosave failed:", err);
        setAutoSaveStatus("error");
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [currentFingerprint, isNew, saving]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = buildPayload();

    const res = await fetch("/api/admin/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Something went wrong. Please try again.");
      setSaving(false);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Mark the current state as saved so the autosave doesn't immediately
    // fire again right before we navigate away.
    lastSavedFingerprintRef.current = JSON.stringify(payload);

    router.push(isPortal ? "/portal/listings" : "/admin/listings");
    router.refresh();
  }

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Floor plan delete confirmation (portal only)
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);
  const [floorPlanDeleteText, setFloorPlanDeleteText] = useState("");

  async function handleDelete() {
    setShowDeleteModal(false);
    setDeleteConfirmText("");
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
    router.push(isPortal ? "/portal/listings" : "/admin/listings");
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
        href={isPortal ? "/portal/listings" : "/admin/listings"}
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
                {(isPortal ? PORTAL_TYPES : TYPES).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {!isPortal && (
              <div>
                <label className={lbl}>Tag</label>
                <input type="text" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. New Release" className={inp} />
              </div>
            )}
            {!isPortal && (
              <div>
                <label className={lbl}>Tier</label>
                <select value={tier} onChange={(e) => setTier(e.target.value)} className={inp + " cursor-pointer"}>
                  <option value="">— No tier —</option>
                  <option value="1st Tier">1st Tier</option>
                  <option value="2nd Tier">2nd Tier</option>
                </select>
                <p className="font-sans text-[11px] text-ink/40 mt-1 leading-relaxed">
                  <strong className="text-ink/60">1st Tier</strong> — featured carousel on the homepage.{" "}
                  <strong className="text-ink/60">2nd Tier</strong> — second homepage row.{" "}
                  <strong className="text-ink/60">No tier</strong> — listing appears in search results only.
                </p>
              </div>
            )}
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
                {(isPortal ? ["6 Months", "12 Months"] : LISTING_DURATIONS).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: developer + website + number of residences */}
          <div className={`${g3} mt-4`}>
            <div>
              <label className={lbl}>Project By (Developer)</label>
              {isPortal ? (
                <input
                  type="text"
                  value={portalDeveloperName}
                  onChange={(e) => setPortalDeveloperName(e.target.value)}
                  placeholder="e.g. ABC Developers Pty Ltd"
                  className={inp}
                />
              ) : (
                <select value={developerId} onChange={(e) => setDeveloperId(e.target.value)} className={inp + " cursor-pointer"}>
                  <option value="">— No developer —</option>
                  {developers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className={lbl}>Developer Website URL</label>
              <input type="url" value={developerWebsite} onChange={(e) => setDeveloperWebsite(e.target.value)} placeholder="https://..." className={inp} />
            </div>
            <div>
              <label className={lbl}>{type === "Townhouses" ? "Number of Homes" : "Number of Apartments / Lots"}</label>
              <input type="number" value={residenceCount} onChange={(e) => setResidenceCount(e.target.value === "" ? "" : Number(e.target.value))} className={inp} />
            </div>
          </div>

          {/* Row 3: assign to member — admin only */}
          {!isPortal && (
            <div className="mt-4">
              <label className={lbl}>Assign to Member <span className="normal-case font-sans text-ink/40 text-xs">(Developer or Agent account)</span></label>
              <select value={ownerUserId} onChange={(e) => setOwnerUserId(e.target.value)} className={inp + " cursor-pointer"}>
                <option value="">— Unassigned —</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name ?? "Unnamed"} — {m.interest_type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Project logo */}
          <div className="mt-5">
            <ImageUpload label="Project Logo" value={logoUrl} onChange={setLogoUrl} bucket="development-images" />
          </div>

          {/* URL slug — admin only */}
          {!isPortal && (
            <div className="mt-4">
              <label className={lbl}>URL Slug *</label>
              <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required className={inp + " font-mono text-label-lg"} />
            </div>
          )}

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
            <RichTextEditor
              value={description}
              onChange={setDescription}
              minHeight={260}
            />
            <p className="font-sans text-[11px] text-ink/40 mt-1">
              Use the toolbar to add bold, italic, headings, lists, links and images. Formatting will be preserved on the public listing page.
            </p>
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
              <label className={lbl}>
                Lead In Pricing
                <ExampleHint title="Where Lead In Pricing appears">
                  <p>This is the headline price shown on the listing card on search results. Free-text, so you can write "From $650,000", "Contact Agent", "Auction", etc.</p>
                  <CardPreview highlight="price" />
                </ExampleHint>
              </label>
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
              <ExampleHint title="Where the Configuration label appears">
                <p>A short summary chip shown beneath the category badge on the listing card. Keep it under 25 characters so it fits without wrapping.</p>
                <CardPreview highlight="config" />
              </ExampleHint>
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

          {/* ── Visibility ── admin only */}
          {!isPortal && (
            <>
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
            </>
          )}
        </AccordionSection>

        {/* ── 3. Configuration Summary ─────────────────────────────────────── */}
        <AccordionSection title="Configuration Summary">
          {isNew ? (
            <p className="font-sans text-sm text-ink/40 italic">Save the listing first to add unit configurations.</p>
          ) : (
            <div>
              <div className="mb-4 flex items-center">
                <p className="font-sans text-xs text-ink/50">
                  Up to 4 rows shown on the public listing card.
                </p>
                <ExampleHint title="Where Configuration Summary appears">
                  <p>Each row you add here becomes one line of the <strong>Properties Available</strong> stats strip on the listing card on search results.</p>
                  <p className="text-ink/50 text-xs">Max 4 rows — the card has space for 4 lines plus the price.</p>
                  <CardPreview highlight="summary" />
                </ExampleHint>
              </div>
              {floorPlans.length > 0 && (() => {
                const cardFields = getCardFields(type);
                return (
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b-2 border-orange/20">
                          {cardFields.map((f) => (
                            <th key={f.key} className="font-sans text-sm font-semibold text-ink/70 px-4 py-3 whitespace-nowrap">{f.label}</th>
                          ))}
                          <th className="font-sans text-sm font-semibold text-ink/70 px-4 py-3 whitespace-nowrap">Price From ($)</th>
                          <th className="font-sans text-sm font-semibold text-ink/70 px-4 py-3 whitespace-nowrap">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {floorPlans.map((fp, i) => (
                          <tr key={i} className="border-b border-line last:border-0">
                            {cardFields.map((f) => {
                              const cellValue = (fp[f.key as keyof FloorPlan] as string) ?? "";
                              const cellClass = `border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 ${f.inputWidth ?? "w-24"}`;
                              return (
                                <td key={f.key} className="px-4 py-3">
                                  {f.type === "select" ? (
                                    <select
                                      value={cellValue}
                                      onChange={(e) => updateFloorPlan(i, f.key as keyof FloorPlan, e.target.value)}
                                      className={`${cellClass} cursor-pointer`}
                                    >
                                      <option value="">{f.placeholder ?? "—"}</option>
                                      {f.options?.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type={f.type}
                                      value={cellValue}
                                      onChange={(e) => updateFloorPlan(i, f.key as keyof FloorPlan, e.target.value)}
                                      placeholder={f.placeholder}
                                      className={cellClass}
                                    />
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-4 py-3">
                              <input type="number" value={fp.price_from} onChange={(e) => updateFloorPlan(i, "price_from", e.target.value)} placeholder="650000" className="border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 w-32" />
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isPortal) {
                                    setFloorPlanDeleteText("");
                                    setPendingDeleteIndex(i);
                                  } else {
                                    removeFloorPlan(i);
                                  }
                                }}
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
                );
              })()}
              <button
                type="button"
                onClick={addFloorPlan}
                disabled={floorPlans.length >= MAX_CONFIG_SUMMARY_ROWS}
                className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors mr-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                + Add ({floorPlans.length}/{MAX_CONFIG_SUMMARY_ROWS})
              </button>
              {floorPlans.length >= MAX_CONFIG_SUMMARY_ROWS && (
                <p className="font-sans text-xs text-orange mt-2">
                  Maximum of {MAX_CONFIG_SUMMARY_ROWS} configurations reached. This is what shows on the public listing card.
                </p>
              )}
              <p className="font-sans text-xs text-ink/40 mt-3">
                Changes save when you click <strong>Save changes</strong> at the bottom of the form.
              </p>
            </div>
          )}
        </AccordionSection>

        {/* ── 3b. Properties Available (mini stocklist) ────────────────────
            Renders as the "Properties Available" table on the public
            listing page. Up to 20 rows per Tim's spec. All cells are
            free text so admins can mirror the existing site's mixed
            content (e.g. "Contact Agent" or "Fr. $660,000"). */}
        <AccordionSection title="Properties Available (Mini Stocklist)">
          <div>
            <p className="font-sans text-sm text-ink/60 mb-4">
              The longer per-unit availability table on the listing detail page.
              Restricted to {MAX_STOCKLIST_ROWS} rows. All fields accept free text —
              leave blank cells empty to show as "—" on the public table.
            </p>
            {miniStocklist.length > 0 && (() => {
              const stockFields = getStocklistFields(type);
              return (
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b-2 border-orange/20">
                        {stockFields.map((f) => (
                          <th key={f.key} className="font-sans text-sm font-semibold text-ink/70 px-4 py-3 whitespace-nowrap">{f.label}</th>
                        ))}
                        <th className="font-sans text-sm font-semibold text-ink/70 px-4 py-3 whitespace-nowrap">Price From</th>
                        <th className="font-sans text-sm font-semibold text-ink/70 px-4 py-3 whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {miniStocklist.map((r, i) => (
                        <tr key={i} className="border-b border-line last:border-0">
                          {stockFields.map((f) => {
                            const stockKey = (f.stocklistKey ?? f.key) as keyof MiniStocklistEntry;
                            const cellValue = (r[stockKey] as string | undefined) ?? "";
                            const cellClass = `border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 ${f.inputWidth ?? "w-24"}`;
                            return (
                              <td key={f.key} className="px-4 py-3">
                                {f.type === "select" ? (
                                  <select
                                    value={cellValue}
                                    onChange={(e) => updateStocklistRow(i, stockKey, e.target.value)}
                                    className={`${cellClass} cursor-pointer`}
                                  >
                                    <option value="">{f.placeholder ?? "—"}</option>
                                    {f.options?.map((opt) => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    value={cellValue}
                                    onChange={(e) => updateStocklistRow(i, stockKey, e.target.value)}
                                    placeholder={f.placeholder}
                                    className={cellClass}
                                  />
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-3">
                            <input type="text" value={r.price} onChange={(e) => updateStocklistRow(i, "price", e.target.value)} placeholder="$890,000 or Contact Agent" className="border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 w-56" />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => removeStocklistRow(i)}
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
              );
            })()}
            <button
              type="button"
              onClick={addStocklistRow}
              disabled={miniStocklist.length >= MAX_STOCKLIST_ROWS}
              className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors mr-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              + Add row ({miniStocklist.length}/{MAX_STOCKLIST_ROWS})
            </button>
            <p className="font-sans text-xs text-ink/40 mt-3">
              Changes save when you click <strong>Save changes</strong> at the bottom of the form.
            </p>
          </div>
        </AccordionSection>

        {/* ── 4. Property Features ─────────────────────────────────────────── */}
        {/* The checklist below is derived from the currently selected
            Category (e.g. Commercial shows business-focused features like
            'Grease trap', 'Shop Front'; residential categories show
            'Fully Equipped Gym', 'BBQ Facilities' etc.). Mirrors the
            per-category taxonomy on the existing live admin. Any custom
            features the user added previously remain visible via
            AddYourOwn even if they're not in the current category's
            standard list. */}
        <AccordionSection title="Property Features">
          {(() => {
            const categoryFeatures = featuresForCategory(type);
            return (
              <>
                <p className="font-sans text-sm text-ink/50 mb-4">
                  ( At least select one property feature is required ){" "}
                  <span className="text-red-500">*</span>
                  {type && (
                    <span className="block text-xs text-ink/40 mt-1">
                      Showing the {type} feature set. Change the Category in
                      Section 1 to see a different list.
                    </span>
                  )}
                </p>
                <div className="grid grid-cols-3 gap-y-3 gap-x-4">
                  {categoryFeatures.map((item) => (
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
                <AddYourOwn lifestyle={lifestyle} setLifestyle={setLifestyle} standardOptions={categoryFeatures} />
              </>
            );
          })()}
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
            <GalleryManager gallery={gallery} onAdd={addGalleryImage} onRemove={removeGalleryImage} onReorder={reorderGallery} />
          )}

          {/* Video Link */}
          <div className="mb-5">
            <label className="font-sans text-sm text-ink/70 block mb-2">Video Link:</label>
            <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/..." className={inp} />
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
        {!isPortal && (
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
        )}

        {/* ── Form actions ─────────────────────────────────────────────────── */}
        {/* Filled-color scheme (2026-06-30): Back = ink/black, Save = green,
            Preview = orange, Delete = red. Same font/tracking as the rest of
            the admin UI so it doesn't feel out of place. Back honours isPortal
            so portal users don't get bounced by middleware to /admin/listings.

            Autosave indicator (2026-07-02) sits next to the Save button so
            users can see their changes are being persisted every few seconds. */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <Link
              href={isPortal ? "/portal/listings" : "/admin/listings"}
              className="font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 bg-ink text-white hover:bg-ink/80 transition-colors inline-flex items-center gap-1.5"
            >
              ← Back
            </Link>
            <button type="submit" disabled={saving || deleting} className="font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 bg-green-700 text-white hover:bg-green-800 transition-colors disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
            {!isNew && autoSaveStatus !== "idle" && (
              <span
                className={`font-mono text-[10px] uppercase tracking-widest ${
                  autoSaveStatus === "saving" ? "text-ink/50"
                  : autoSaveStatus === "saved" ? "text-green-700"
                  : "text-red-600"
                }`}
              >
                {autoSaveStatus === "saving" ? "Autosaving…"
                  : autoSaveStatus === "saved" ? "✓ Saved"
                  : "Autosave failed"}
              </span>
            )}
            {!isNew && existing?.slug && (
              <Link
                href={`/listings/${existing.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 bg-orange text-white hover:bg-orange/85 transition-colors"
              >
                Preview
              </Link>
            )}
          </div>
          {!isNew && (
            <button
              type="button"
              onClick={() => { setDeleteConfirmText(""); setShowDeleteModal(true); }}
              disabled={deleting || saving}
              className="font-mono text-label-sm uppercase tracking-widest px-4 py-2 bg-red-700 text-white hover:bg-red-800 transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete listing"}
            </button>
          )}
        </div>
      </form>

      {/* ── Delete confirmation modal ─────────────────────────────────────── */}
      {/* Floor plan delete confirmation modal (portal only) */}
      {pendingDeleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50">
          <div className="bg-white w-full max-w-md mx-4 p-6 flex flex-col gap-4">
            <h2 className="font-mono text-[13px] uppercase tracking-widest text-ink font-bold">Delete Configuration</h2>
            <p className="font-sans text-sm text-ink/70">
              You are about to delete the configuration:{" "}
              <strong>
                {floorPlans[pendingDeleteIndex]?.beds || "—"} Bed,{" "}
                {floorPlans[pendingDeleteIndex]?.bath || "—"} Bath,{" "}
                {floorPlans[pendingDeleteIndex]?.garage || "—"} Garage
                {floorPlans[pendingDeleteIndex]?.internal_sqm ? `, ${floorPlans[pendingDeleteIndex].internal_sqm} sqm` : ""}
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
    </div>
  );
}
