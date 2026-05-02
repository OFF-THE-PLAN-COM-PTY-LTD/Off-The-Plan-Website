import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminDashboard() {
  const [
    { count: devCount },
    { count: articleCount },
    { count: enquiryCount },
    { count: memberCount },
    { count: leadCount },
  ] = await Promise.all([
    supabaseAdmin.from("developments").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("journal_articles").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("enquiries").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("circle_signups").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("developer_leads").select("*", { count: "exact", head: true }),
  ]);

  const cards = [
    { label: "Developments", count: devCount ?? 0, href: "/admin/developments", action: "Manage listings" },
    { label: "Journal Articles", count: articleCount ?? 0, href: "/admin/journal", action: "Manage articles" },
    { label: "Enquiries", count: enquiryCount ?? 0, href: "/admin/enquiries", action: "View enquiries" },
    { label: "Circle Members", count: memberCount ?? 0, href: "/admin/members", action: "View members" },
    { label: "Developer Leads", count: leadCount ?? 0, href: "/admin/leads", action: "View leads" },
  ];

  return (
    <div>
      <h1 className="font-display font-light text-navy text-section-lg mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white border border-line p-6">
            <p className="font-mono text-label-sm uppercase tracking-widest text-ink/30 mb-1">{card.label}</p>
            <p className="font-display text-[48px] font-light text-navy mb-4">{card.count}</p>
            <Link href={card.href} className="font-mono text-label-lg uppercase tracking-widest text-orange hover:underline">
              {card.action} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
