import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function AgencyProfilePage({ params }: { params: { id: string } }) {
  const { data: agency } = await supabaseAdmin
    .from("agencies")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!agency) notFound();

  const socials = [
    { label: "Facebook", key: "facebook_url", url: agency.facebook_url },
    { label: "Instagram", key: "instagram_url", url: agency.instagram_url },
    { label: "LinkedIn", key: "linkedin_url", url: agency.linkedin_url },
    { label: "Pinterest", key: "pinterest_url", url: agency.pinterest_url },
    { label: "Youtube", key: "youtube_url", url: agency.youtube_url },
    { label: "Website", key: "website_url", url: agency.website_url },
  ];

  return (
    <div className="max-w-3xl">
      {/* Back link */}
      <Link
        href="/admin/agencies"
        className="inline-block font-sans text-sm text-ink/40 hover:text-ink transition-colors mb-4"
      >
        ← All Agencies
      </Link>

      {/* Page header bar */}
      <div className="bg-navy px-5 py-3 mb-4">
        <h1 className="font-sans font-semibold text-white text-sm uppercase tracking-widest">Manage Profile</h1>
      </div>

      {/* Profile header */}
      <div className="bg-white border border-line p-5 mb-4 flex items-center gap-4">
        {agency.profile_pic ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={agency.profile_pic}
            alt={agency.name ?? ""}
            className="w-16 h-16 rounded-full object-cover border border-line"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-cream-alt border border-line flex items-center justify-center font-display text-navy text-2xl font-bold">
            {(agency.name ?? "?")[0].toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-sans font-semibold text-ink text-base leading-tight">{agency.name ?? "—"}</p>
          {agency.email && <p className="font-sans text-sm text-ink/60 mt-0.5">{agency.email}</p>}
          <div className="flex gap-2 mt-1.5">
            <span className={`inline-block px-2 py-0.5 text-xs font-sans font-semibold rounded ${
              agency.email_verified ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
            }`}>
              {agency.email_verified ? "Verified" : "Not Verified"}
            </span>
            <span className={`inline-block px-2 py-0.5 text-xs font-sans font-semibold rounded ${
              agency.portal_status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
              {agency.portal_status === "active" ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Personal Details */}
      <div className="bg-white border border-line mb-4">
        <div className="flex items-center justify-between px-5 py-3 border-b border-line">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-ink">Personal Details</h2>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          <Field label="First Name" value={agency.first_name} />
          <Field label="Last Name" value={agency.last_name} />
          <Field label="Email" value={agency.email} />
          <Field label="Mobile" value={agency.mobile} />
        </div>
      </div>

      {/* Company Details */}
      <div className="bg-white border border-line mb-4">
        <div className="flex items-center justify-between px-5 py-3 border-b border-line">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-ink">Company Details</h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          <Field label="Business Name" value={agency.org_name} />
          {agency.about && (
            <div>
              <p className="font-sans text-xs text-ink/40 uppercase tracking-wider mb-1">About</p>
              <p className="font-sans text-sm text-ink leading-relaxed">{agency.about}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email Address (if different)" value={agency.org_email} />
            <Field label="Phone" value={agency.org_phone} />
          </div>
        </div>
      </div>

      {/* Logos */}
      <div className="bg-white border border-line mb-4">
        <div className="flex items-center justify-between px-5 py-3 border-b border-line">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-ink">Logos</h2>
        </div>
        <div className="grid grid-cols-2 divide-x divide-line">
          <div className="p-5 text-center">
            <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ink mb-3">Your Company Logo</p>
            {agency.org_logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agency.org_logo_url}
                alt="Company logo"
                className="mx-auto max-h-24 max-w-full object-contain"
              />
            ) : (
              <p className="font-sans text-sm text-ink/30 italic">No logo uploaded</p>
            )}
          </div>
          <div className="p-5 text-center">
            <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ink mb-3">Developer Logo</p>
            {agency.dev_logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agency.dev_logo_url}
                alt="Developer logo"
                className="mx-auto max-h-24 max-w-full object-contain"
              />
            ) : (
              <p className="font-sans text-sm text-ink/30 italic">No logo uploaded</p>
            )}
          </div>
        </div>
      </div>

      {/* Social Reach */}
      <div className="bg-white border border-line mb-4">
        <div className="flex items-center justify-between px-5 py-3 border-b border-line">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-ink">Social Reach</h2>
        </div>
        <div className="divide-y divide-line">
          {socials.map((s) => (
            <div key={s.key} className="flex items-center px-5 py-3 gap-4">
              <span className="font-sans text-xs text-ink/50 w-20 shrink-0">{s.label}</span>
              {s.url ? (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-sm text-blue-600 hover:underline truncate"
                >
                  {s.url}
                </a>
              ) : (
                <span className="font-sans text-sm text-ink/25 italic">Not set</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white border border-line">
        <div className="flex items-center justify-between px-5 py-3 border-b border-line">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-ink">Stats</h2>
        </div>
        <div className="grid grid-cols-2 divide-x divide-line">
          <div className="p-5">
            <p className="font-sans text-xs text-ink/40 uppercase tracking-wider mb-1">Total Active Listings</p>
            <p className="font-display font-semibold text-navy text-2xl">{agency.total_active_listings}</p>
          </div>
          <div className="p-5">
            <p className="font-sans text-xs text-ink/40 uppercase tracking-wider mb-1">Type</p>
            <p className="font-display font-semibold text-navy text-2xl">{agency.is_developer ? "Developer" : "Agency"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="font-sans text-xs text-ink/40 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="font-sans text-sm text-ink border-b border-line pb-1.5">{value || "—"}</p>
    </div>
  );
}
