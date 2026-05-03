import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";

export default async function AdminEnquiriesPage() {
  const { data } = await supabaseAdmin
    .from("enquiries")
    .select("*, development:developments(name)")
    .order("created_at", { ascending: false });

  const enquiries = data ?? [];

  return (
    <div>
      <h1 className="font-display font-light text-navy text-section-lg mb-6">Enquiries</h1>
      {enquiries.length > 0 ? (
        <div className="bg-white border border-line overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line">
                {["Development", "Name", "Email", "Mobile", "Date", "Status"].map((h) => (
                  <th key={h} className="font-sans text-sm font-semibold text-ink/60 px-4 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enquiries.map((e: any) => (
                <tr key={e.id} className="border-b border-line last:border-0 hover:bg-cream-alt transition-colors">
                  <td className="px-4 py-4 font-sans text-sm text-navy">{e.development?.name ?? "—"}</td>
                  <td className="px-4 py-4 font-sans text-sm">{e.full_name}</td>
                  <td className="px-4 py-3 font-sans text-sm text-ink/60">{e.email}</td>
                  <td className="px-4 py-3 font-sans text-sm text-ink/60">{e.mobile ?? "—"}</td>
                  <td className="px-4 py-3 font-sans text-sm text-ink/60">{formatDate(e.created_at)}</td>
                  <td className="px-4 py-3 font-sans text-sm text-orange capitalize">{e.status ?? "New"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="font-sans text-body-md text-ink/40">No enquiries yet. They'll appear here when buyers submit the form.</p>
      )}
    </div>
  );
}
