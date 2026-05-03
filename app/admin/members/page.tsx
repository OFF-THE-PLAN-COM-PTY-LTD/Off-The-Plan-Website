import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";

export default async function AdminMembersPage() {
  const { data } = await supabaseAdmin
    .from("circle_signups")
    .select("*")
    .order("created_at", { ascending: false });

  const members = data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-light text-navy text-section-lg">Circle Members</h1>
        <p className="font-sans text-sm text-ink/40 uppercase tracking-widest">{members.length} total</p>
      </div>
      {members.length > 0 ? (
        <div className="bg-white border border-line overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line">
                {["Name", "Email", "Interest", "Joined"].map((h) => (
                  <th key={h} className="font-sans text-sm font-semibold text-ink/60 px-4 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m: any) => (
                <tr key={m.id} className="border-b border-line last:border-0 hover:bg-cream-alt transition-colors">
                  <td className="px-4 py-4 font-sans text-sm">{m.full_name}</td>
                  <td className="px-4 py-3 font-sans text-sm text-ink/60">{m.email}</td>
                  <td className="px-4 py-3 font-sans text-sm text-ink/60 capitalize">{m.interest_type ?? "—"}</td>
                  <td className="px-4 py-3 font-sans text-sm text-ink/60">{formatDate(m.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="font-sans text-body-md text-ink/40">No members yet. They'll appear here when buyers sign up.</p>
      )}
    </div>
  );
}
