import { redirect } from "next/navigation";
import Link from "next/link";
import { Eye, Phone, Share2, MessageSquare, Building2, Star, Sparkles, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { LogoUploader } from "./logo-uploader";

const MOTIVATIONAL = [
  "Let's make today count.",
  "Your listings are live and working hard.",
  "Ready to close some deals?",
  "Great things are happening on the platform.",
  "Another day, another opportunity.",
];

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

  const motivational = MOTIVATIONAL[new Date().getDay() % MOTIVATIONAL.length];
  const today = new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

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
      <div
        className="relative overflow-hidden rounded-sm px-8 py-6 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #1a2340 0%, #2d3a5e 60%, #3b4f82 100%)" }}
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10" style={{ background: "#e85d26" }} />
        <div className="absolute -bottom-8 right-32 w-32 h-32 rounded-full opacity-5" style={{ background: "#fff" }} />
        <div className="relative z-10">
          <p className="text-white/60 text-sm font-medium mb-1">{today}</p>
          <h1 className="text-white font-bold text-2xl mb-1">👋 Good Day, {firstName}!</h1>
          <p className="text-white/50 text-sm flex items-center gap-1.5">
            <Sparkles size={13} className="text-orange-400" />
            {motivational}
          </p>
        </div>
        <div className="relative z-10 hidden md:flex items-center gap-3">
          <div className="text-right">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-0.5">Platform Status</p>
            <p className="text-white font-semibold text-sm flex items-center gap-1.5 justify-end">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              All Systems Live
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(232,93,38,0.2)", border: "1px solid rgba(232,93,38,0.4)" }}
          >
            <TrendingUp size={18} className="text-orange-400" />
          </div>
        </div>
      </div>

      {/* Performance stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white border border-gray-200 rounded px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#1a2340" }}>
              <Icon size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest leading-tight">{label}</p>
              <p className="text-xl font-bold text-gray-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active + Featured counts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-gray-200 rounded p-6 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Active Listings</p>
          <p className="font-bold mb-3" style={{ fontSize: 48, color: "#e85d26" }}>{activeCount}</p>
          <Link href="/portal/listings" className="text-xs font-bold uppercase tracking-widest text-orange-500 hover:underline">
            VIEW LISTINGS »
          </Link>
        </div>
        <div className="bg-white border border-gray-200 rounded p-6 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Featured Listings</p>
          <p className="font-bold mb-3" style={{ fontSize: 48, color: "#e85d26" }}>{featuredCount}</p>
          <Link href="/portal/listings" className="text-xs font-bold uppercase tracking-widest text-orange-500 hover:underline">
            VIEW LISTINGS »
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
