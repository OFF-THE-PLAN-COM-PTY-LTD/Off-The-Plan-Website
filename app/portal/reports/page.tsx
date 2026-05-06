import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Eye, Phone, Share2, MessageSquare } from "lucide-react";

export default async function PortalReports() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listings } = await supabaseAdmin
    .from("developments")
    .select("id, name, suburb, state, is_published, view_count, phone_click_count, share_count")
    .eq("owner_user_id", user.id)
    .order("view_count", { ascending: false });

  const devIds = (listings ?? []).map((l) => l.id as string);

  const enquiryCounts: Record<string, number> = {};
  if (devIds.length > 0) {
    const { data: enquiries } = await supabaseAdmin
      .from("enquiries")
      .select("development_id")
      .in("development_id", devIds);
    (enquiries ?? []).forEach((e) => {
      const id = e.development_id as string;
      enquiryCounts[id] = (enquiryCounts[id] ?? 0) + 1;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl text-ink">Listing Reports</h1>
        <p className="font-sans text-sm text-ink/50 mt-1">Performance breakdown per listing.</p>
      </div>

      <div className="bg-white">
        {(listings ?? []).length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="font-sans text-sm text-ink/40">No listings to report on yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-line bg-cream/40">
                <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/40">Project</th>
                <th className="px-5 py-3 text-center font-mono text-[10px] uppercase tracking-widest text-ink/40">
                  <span className="flex items-center justify-center gap-1"><Eye size={11} /> Views</span>
                </th>
                <th className="px-5 py-3 text-center font-mono text-[10px] uppercase tracking-widest text-ink/40">
                  <span className="flex items-center justify-center gap-1"><MessageSquare size={11} /> Enquiries</span>
                </th>
                <th className="px-5 py-3 text-center font-mono text-[10px] uppercase tracking-widest text-ink/40 hidden md:table-cell">
                  <span className="flex items-center justify-center gap-1"><Phone size={11} /> Calls</span>
                </th>
                <th className="px-5 py-3 text-center font-mono text-[10px] uppercase tracking-widest text-ink/40 hidden md:table-cell">
                  <span className="flex items-center justify-center gap-1"><Share2 size={11} /> Shares</span>
                </th>
                <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/40">Status</th>
              </tr>
            </thead>
            <tbody>
              {(listings ?? []).map((l) => (
                <tr key={l.id as string} className="border-b border-line last:border-0 hover:bg-cream/30 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-sans text-sm text-ink font-medium">{l.name as string}</p>
                    <p className="font-sans text-xs text-ink/40">{l.suburb as string}, {l.state as string}</p>
                  </td>
                  <td className="px-5 py-4 text-center font-serif text-xl text-orange">
                    {(l.view_count as number) ?? 0}
                  </td>
                  <td className="px-5 py-4 text-center font-serif text-xl text-orange">
                    {enquiryCounts[l.id as string] ?? 0}
                  </td>
                  <td className="px-5 py-4 text-center font-serif text-xl text-orange hidden md:table-cell">
                    {(l.phone_click_count as number) ?? 0}
                  </td>
                  <td className="px-5 py-4 text-center font-serif text-xl text-orange hidden md:table-cell">
                    {(l.share_count as number) ?? 0}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border ${
                      l.is_published
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-ink/5 text-ink/40 border-line"
                    }`}>
                      {l.is_published ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
