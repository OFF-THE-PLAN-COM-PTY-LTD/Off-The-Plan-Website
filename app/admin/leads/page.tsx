import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";

export default async function AdminLeadsPage() {
  const { data } = await supabaseAdmin
    .from("developer_leads")
    .select("*")
    .order("created_at", { ascending: false });

  const leads = data ?? [];

  return (
    <div>
      <h1 className="font-display font-light text-navy text-section-lg mb-6">Developer Leads</h1>
      {leads.length > 0 ? (
        <div className="bg-white border border-line overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line">
                {["Name", "Email", "Company", "Message", "Date"].map((h) => (
                  <th key={h} className="font-mono text-label-sm uppercase tracking-widest text-ink/40 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((l: any) => (
                <tr key={l.id} className="border-b border-line last:border-0 hover:bg-cream-alt transition-colors">
                  <td className="px-4 py-3 font-sans text-body-md">{l.full_name}</td>
                  <td className="px-4 py-3 font-mono text-label-sm text-ink/60">{l.email}</td>
                  <td className="px-4 py-3 font-sans text-body-md text-ink/60">{l.company ?? "—"}</td>
                  <td className="px-4 py-3 font-sans text-body-md text-ink/60 max-w-xs truncate">{l.message ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-label-sm text-ink/60">{formatDate(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="font-sans text-body-md text-ink/40">No developer leads yet. They'll appear here when developers submit the form.</p>
      )}
    </div>
  );
}
