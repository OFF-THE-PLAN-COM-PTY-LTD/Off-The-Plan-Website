import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminDashboard() {
  const [
    { count: totalListings },
    { count: featuredListings },
    { count: enquiryCount },
    { count: memberCount },
    { count: leadCount },
    { count: articleCount },
    { data: recentSignups },
    { data: recentEnquiries },
  ] = await Promise.all([
    supabaseAdmin.from("developments").select("*", { count: "exact", head: true }).eq("is_published", true),
    supabaseAdmin.from("developments").select("*", { count: "exact", head: true }).eq("is_published", true).eq("is_featured", true),
    supabaseAdmin.from("enquiries").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("circle_signups").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("developer_leads").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("journal_articles").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("circle_signups").select("name, email, phone, interest_type, state, created_at").order("created_at", { ascending: false }).limit(10),
    supabaseAdmin.from("enquiries").select("name, email, phone, development_id, created_at, status").order("created_at", { ascending: false }).limit(5),
  ]);

  const statCards = [
    { label: "Active Listings", count: totalListings ?? 0, href: "/admin/developments", action: "View listings" },
    { label: "Featured Listings", count: featuredListings ?? 0, href: "/admin/developments", action: "View listings" },
    { label: "Total Enquiries", count: enquiryCount ?? 0, href: "/admin/enquiries", action: "View enquiries" },
    { label: "Member Sign Ups", count: memberCount ?? 0, href: "/admin/members", action: "View members" },
    { label: "Developer Leads", count: leadCount ?? 0, href: "/admin/leads", action: "View leads" },
    { label: "Journal Articles", count: articleCount ?? 0, href: "/admin/journal", action: "Manage articles" },
  ];

  return (
    <div className="flex flex-col gap-10">
      <h1 className="font-display font-light text-navy text-section-lg">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white border border-line p-6">
            <p className="font-sans text-sm uppercase tracking-widest text-ink/30 mb-1">{card.label}</p>
            <p className="font-display text-[48px] font-light text-navy leading-none mb-4">{card.count}</p>
            <Link href={card.href} className="font-mono text-label-lg uppercase tracking-widest text-orange hover:underline">
              {card.action} →
            </Link>
          </div>
        ))}
      </div>

      {/* Recent enquiries */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-light text-navy text-section-md">Recent Enquiries</h2>
          <Link href="/admin/enquiries" className="font-sans text-sm uppercase tracking-widest text-orange hover:underline">
            View all →
          </Link>
        </div>
        <div className="bg-white border border-line overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line">
                {["Name", "Email", "Phone", "Status", "Date"].map((h) => (
                  <th key={h} className="font-sans text-sm font-semibold text-ink/60 px-4 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(recentEnquiries ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 font-sans text-body-md text-ink/40 text-center">No enquiries yet</td>
                </tr>
              ) : (
                (recentEnquiries ?? []).map((e, i) => (
                  <tr key={i} className="border-b border-line last:border-0 hover:bg-cream-alt transition-colors">
                    <td className="px-4 py-3 font-sans text-body-md text-navy">{e.name}</td>
                    <td className="px-4 py-3 font-sans text-sm text-ink/60">{e.email}</td>
                    <td className="px-4 py-3 font-sans text-sm text-ink/60">{e.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`font-sans text-sm uppercase tracking-widest ${e.status === "new" ? "text-orange" : "text-ink/40"}`}>
                        {e.status ?? "New"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans text-sm text-ink/40">
                      {new Date(e.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Property alert / member sign-ups */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-light text-navy text-section-md">Member Sign Ups</h2>
          <Link href="/admin/members" className="font-sans text-sm uppercase tracking-widest text-orange hover:underline">
            View all →
          </Link>
        </div>
        <div className="bg-white border border-line overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line">
                {["Name", "Email", "Phone", "Interest", "State", "Date"].map((h) => (
                  <th key={h} className="font-sans text-sm font-semibold text-ink/60 px-4 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(recentSignups ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 font-sans text-body-md text-ink/40 text-center">No sign ups yet</td>
                </tr>
              ) : (
                (recentSignups ?? []).map((s, i) => (
                  <tr key={i} className="border-b border-line last:border-0 hover:bg-cream-alt transition-colors">
                    <td className="px-4 py-3 font-sans text-body-md text-navy">{s.name}</td>
                    <td className="px-4 py-3 font-sans text-sm text-ink/60">{s.email}</td>
                    <td className="px-4 py-3 font-sans text-sm text-ink/60">{s.phone ?? "—"}</td>
                    <td className="px-4 py-3 font-sans text-sm text-ink/60">{s.interest_type ?? "—"}</td>
                    <td className="px-4 py-3 font-sans text-sm text-ink/60">{s.state ?? "—"}</td>
                    <td className="px-4 py-3 font-sans text-sm text-ink/40">
                      {new Date(s.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
