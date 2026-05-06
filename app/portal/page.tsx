import { redirect } from "next/navigation";
import Link from "next/link";
import { Eye, Phone, Share2, MessageSquare, Building2, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { LogoUploader } from "./logo-uploader";

export default async function PortalDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, company_logo_url, developer_logo_url")
    .eq("id", user.id)
    .single();

  const { data: listings } = await supabaseAdmin
    .from("developments")
    .select("id, name, suburb, state, type, price_display, is_published, is_featured, view_count, phone_click_count, share_count, hero_image_url")
    .eq("owner_user_id", user.id)
    .order("name");

  const devIds = (listings ?? []).map((l) => l.id as string);

  const { count: enquiryCount } = devIds.length > 0
    ? await supabaseAdmin
        .from("enquiries")
        .select("*", { count: "exact", head: true })
        .in("development_id", devIds)
    : { count: 0 };

  const totalViews = (listings ?? []).reduce((s, d) => s + ((d.view_count as number) ?? 0), 0);
  const totalPhoneClicks = (listings ?? []).reduce((s, d) => s + ((d.phone_click_count as number) ?? 0), 0);
  const totalShares = (listings ?? []).reduce((s, d) => s + ((d.share_count as number) ?? 0), 0);
  const activeCount = (listings ?? []).filter((l) => l.is_published).length;
  const featuredCount = (listings ?? []).filter((l) => l.is_featured).length;

  const rawName = (profile?.full_name as string | null)?.split(" ")[0]
    ?? user.email?.split("@")[0]
    ?? "there";
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  const hour = new Date().getHours();
  const timeLabel = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  const stats = [
    { label: "Total Views",     value: totalViews,        icon: Eye },
    { label: "Total Enquiries", value: enquiryCount ?? 0, icon: MessageSquare },
    { label: "Phone Clicks",    value: totalPhoneClicks,  icon: Phone },
    { label: "Total Shares",    value: totalShares,       icon: Share2 },
  ];

  const companyLogoUrl = (profile as Record<string, unknown>)?.company_logo_url as string | null ?? null;
  const developerLogoUrl = (profile as Record<string, unknown>)?.developer_logo_url as string | null ?? null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="p-6 text-white" style={{ background: "#1a2340" }}>
        <p className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-1">
          {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h1 className="font-serif text-2xl">{timeLabel}, {firstName}!</h1>
        <p className="font-sans text-sm text-white/50 mt-1">Here's an overview of your listings and performance.</p>
      </div>

      {/* Performance stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white p-5 flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink/40">{label}</p>
              <p className="font-serif text-3xl text-orange mt-1">{value}</p>
            </div>
            <Icon size={28} className="text-ink/10" />
          </div>
        ))}
      </div>

      {/* Active + Featured counts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Building2 size={28} className="text-orange/60" />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink/40">Active Listings</p>
              <p className="font-serif text-3xl text-ink mt-1">{activeCount}</p>
            </div>
          </div>
          <Link
            href="/portal/listings"
            className="font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 border border-ink/20 text-ink/60 hover:border-ink hover:text-ink transition-colors self-start"
          >
            View All
          </Link>
        </div>
        <div className="bg-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Star size={28} className="text-orange/60" />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink/40">Featured Listings</p>
              <p className="font-serif text-3xl text-ink mt-1">{featuredCount}</p>
            </div>
          </div>
          <Link
            href="/portal/listings"
            className="font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 border border-ink/20 text-ink/60 hover:border-ink hover:text-ink transition-colors self-start"
          >
            View All
          </Link>
        </div>
      </div>

      {/* Manage Listings */}
      <div className="bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-ink font-bold">Manage Your Listings</h2>
          <div className="flex items-center gap-2">
            <Link
              href="/contact"
              className="font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 bg-orange text-white hover:bg-orange/90 transition-colors"
            >
              + New
            </Link>
            <Link
              href="/portal/listings"
              className="font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 border border-ink text-ink hover:bg-ink hover:text-white transition-colors"
            >
              View All
            </Link>
          </div>
        </div>
        {(listings ?? []).length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="font-sans text-sm text-ink/40">No listings assigned yet.</p>
            <p className="font-sans text-xs text-ink/30 mt-1">Contact the platform admin to get your first listing set up.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-line bg-cream/40">
                <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/40 w-16" />
                <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/40">Project</th>
                <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/40 hidden md:table-cell">Price</th>
                <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/40 hidden md:table-cell">Category</th>
                <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/40">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {(listings ?? []).slice(0, 5).map((l) => (
                <tr key={l.id as string} className="border-b border-line last:border-0 hover:bg-cream/30 transition-colors">
                  <td className="px-5 py-3">
                    {l.hero_image_url ? (
                      <img src={l.hero_image_url as string} alt="" className="w-14 h-10 object-cover" />
                    ) : (
                      <div className="w-14 h-10 bg-line" />
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-sans text-sm text-ink font-medium leading-tight">{l.name as string}</p>
                    <p className="font-sans text-xs text-ink/40 mt-0.5">{l.suburb as string}, {l.state as string}</p>
                  </td>
                  <td className="px-5 py-3 font-sans text-sm text-ink/60 hidden md:table-cell">
                    {(l.price_display as string) ?? "—"}
                  </td>
                  <td className="px-5 py-3 font-sans text-sm text-ink/60 hidden md:table-cell">
                    {(l.type as string) ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border w-fit ${
                        l.is_published
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-ink/5 text-ink/40 border-line"
                      }`}>
                        {l.is_published ? "Active" : "Inactive"}
                      </span>
                      {l.is_featured && (
                        <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border w-fit bg-orange/10 text-orange border-orange/20">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/listings/${l.id}`}
                      className="font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 border border-ink/30 text-ink/60 hover:border-ink hover:text-ink transition-colors whitespace-nowrap"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Profile & Logos */}
      <div className="bg-white p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-mono text-[11px] uppercase tracking-widest text-ink font-bold">Update Your Profile</h2>
            <p className="font-sans text-xs text-ink/40 mt-1">Upload logos that appear on your listings.</p>
          </div>
          <Link
            href="/portal/profile"
            className="font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 border border-ink text-ink hover:bg-ink hover:text-white transition-colors"
          >
            Manage Profile
          </Link>
        </div>
        <div className="flex gap-8">
          <LogoUploader field="company_logo_url" label="Company Logo" currentUrl={companyLogoUrl} />
          <LogoUploader field="developer_logo_url" label="Developer Logo" currentUrl={developerLogoUrl} />
        </div>
      </div>
    </div>
  );
}
