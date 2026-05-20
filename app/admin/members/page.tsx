import { supabaseAdmin } from "@/lib/supabase/admin";
import { MemberActions } from "./member-actions";

export const dynamic = "force-dynamic";

interface Profile {
  id: string;
  full_name: string | null;
  interest_type: string | null;
  member_status: string;
  created_at: string;
}

const STATUS_FILTERS = [
  { key: "pending",  label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all",      label: "All" },
];

const STATUS_STYLES: Record<string, string> = {
  pending:  "bg-orange/10 text-orange border-orange/30",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

interface Props {
  searchParams: { status?: string };
}

export default async function AdminMembersPage({ searchParams }: Props) {
  const statusFilter = searchParams.status ?? "pending";

  let query = supabaseAdmin
    .from("profiles")
    .select("id, full_name, interest_type, member_status, created_at")
    .order("created_at", { ascending: false });

  if (statusFilter !== "all" && STATUS_FILTERS.some((f) => f.key === statusFilter)) {
    query = query.eq("member_status", statusFilter);
  }

  const { data } = await query;
  const profiles = (data ?? []) as Profile[];

  // Fetch emails from auth.users for each profile.
  const emailById = new Map<string, string>();
  if (profiles.length > 0) {
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    for (const u of users ?? []) {
      emailById.set(u.id, u.email ?? "");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-[12px] uppercase tracking-widest text-ink font-bold">
          Members
        </h1>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-1 border-b border-line">
        {STATUS_FILTERS.map((f) => (
          <a
            key={f.key}
            href={f.key === "pending" ? "/admin/members" : `/admin/members?status=${f.key}`}
            className={`font-mono text-[10px] uppercase tracking-widest px-4 py-2 border-b-2 transition-colors ${
              statusFilter === f.key
                ? "border-orange text-ink"
                : "border-transparent text-ink/50 hover:text-ink"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      {profiles.length === 0 ? (
        <div className="bg-white border border-line p-12 text-center">
          <p className="font-sans text-sm text-ink/50">No members in this view.</p>
        </div>
      ) : (
        <div className="bg-white border border-line overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line bg-cream/40">
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/40">Joined</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/40">Name</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/40">Email</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/40">Type</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/40">Status</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const statusCls = STATUS_STYLES[p.member_status] ?? "bg-ink/5 text-ink/60 border-line";
                return (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-sans text-[12px] text-ink/70 whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString("en-AU", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 font-sans text-[12px] text-ink">
                      {p.full_name ?? <span className="text-ink/40">—</span>}
                    </td>
                    <td className="px-4 py-3 font-sans text-[12px] text-ink/70">
                      {emailById.get(p.id) ?? <span className="text-ink/40">—</span>}
                    </td>
                    <td className="px-4 py-3 font-sans text-[12px] text-ink/70">
                      {p.interest_type ?? <span className="text-ink/40">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border ${statusCls}`}>
                        {p.member_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <MemberActions id={p.id} status={p.member_status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
