import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminDevelopmentsPage() {
  const { data } = await supabaseAdmin
    .from("developments")
    .select("id, name, suburb, state, status, is_published")
    .order("name");

  const developments = data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-light text-navy text-section-lg">Developments</h1>
        <Link href="/admin/developments/new" className="btn-primary">+ Add development</Link>
      </div>

      <div className="bg-white border border-line overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line">
              <th className="font-mono text-label-sm uppercase tracking-widest text-ink/40 px-4 py-3">Name</th>
              <th className="font-mono text-label-sm uppercase tracking-widest text-ink/40 px-4 py-3">Location</th>
              <th className="font-mono text-label-sm uppercase tracking-widest text-ink/40 px-4 py-3">Status</th>
              <th className="font-mono text-label-sm uppercase tracking-widest text-ink/40 px-4 py-3">Published</th>
              <th className="font-mono text-label-sm uppercase tracking-widest text-ink/40 px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {developments.map((dev) => (
              <tr key={dev.id} className="border-b border-line last:border-0 hover:bg-cream-alt transition-colors">
                <td className="px-4 py-3 font-sans text-body-md text-navy font-medium">{dev.name}</td>
                <td className="px-4 py-3 font-mono text-label-sm text-ink/60">{dev.suburb}, {dev.state}</td>
                <td className="px-4 py-3 font-mono text-label-sm text-ink/60">{dev.status}</td>
                <td className="px-4 py-3">
                  <span className={`font-mono text-label-sm ${dev.is_published ? "text-green-600" : "text-ink/30"}`}>
                    {dev.is_published ? "Live" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/developments/${dev.id}`} className="font-mono text-label-sm text-orange hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
