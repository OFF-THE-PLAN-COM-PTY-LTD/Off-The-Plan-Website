import { supabaseAdmin } from "@/lib/supabase/admin";
import { UpgradeRequestActions } from "./upgrade-request-actions";

export const dynamic = "force-dynamic";

interface RequestRow {
  id: string;
  user_id: string | null;
  development_id: string | null;
  upgrade_type: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface UserRef {
  id: string;
  full_name: string | null;
  interest_type: string | null;
}

interface DevRef {
  id: string;
  name: string;
  slug: string | null;
}

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All" },
];

interface Props {
  searchParams: { status?: string };
}

export default async function UpgradeRequestsPage({ searchParams }: Props) {
  const status = searchParams.status ?? "pending";

  let query = supabaseAdmin
    .from("upgrade_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (status !== "all" && STATUS_FILTERS.some((f) => f.key === status)) {
    query = query.eq("status", status);
  }

  const { data: requests } = await query;
  const rows = (requests ?? []) as RequestRow[];

  // Fetch related users + developments in parallel.
  const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean))) as string[];
  const devIds = Array.from(new Set(rows.map((r) => r.development_id).filter(Boolean))) as string[];

  const [usersResult, devsResult] = await Promise.all([
    userIds.length > 0
      ? supabaseAdmin.from("profiles").select("id, full_name, interest_type").in("id", userIds)
      : Promise.resolve({ data: [] as UserRef[] }),
    devIds.length > 0
      ? supabaseAdmin.from("developments").select("id, name, slug").in("id", devIds)
      : Promise.resolve({ data: [] as DevRef[] }),
  ]);

  const usersById = new Map<string, UserRef>(
    ((usersResult.data ?? []) as UserRef[]).map((u) => [u.id, u]),
  );
  const devsById = new Map<string, DevRef>(
    ((devsResult.data ?? []) as DevRef[]).map((d) => [d.id, d]),
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-[12px] uppercase tracking-widest text-ink font-bold">
          Upgrade Requests
        </h1>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-1 border-b border-line">
        {STATUS_FILTERS.map((f) => (
          <a
            key={f.key}
            href={f.key === "pending" ? "/admin/upgrade-requests" : `/admin/upgrade-requests?status=${f.key}`}
            className={`font-mono text-[12px] uppercase tracking-widest px-4 py-2 border-b-2 transition-colors ${
              status === f.key
                ? "border-orange text-ink"
                : "border-transparent text-ink/50 hover:text-ink"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="bg-white border border-line p-12 text-center">
          <p className="font-sans text-sm text-ink/50">No upgrade requests in this view.</p>
        </div>
      ) : (
        <div className="bg-white border border-line overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line bg-cream/40">
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/40">
                  Requested
                </th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/40">
                  Account
                </th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/40">
                  Listing
                </th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/40">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/40">
                  Dates
                </th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/40">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/40">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const member = r.user_id ? usersById.get(r.user_id) : null;
                const dev = r.development_id ? devsById.get(r.development_id) : null;
                return (
                  <tr key={r.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-sans text-[12px] text-ink/70 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString("en-AU", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 font-sans text-[12px] text-ink">
                      {member?.full_name ?? <span className="text-ink/40">—</span>}
                      {member?.interest_type && (
                        <span className="ml-2 font-mono text-[9px] uppercase tracking-widest text-ink/40">
                          {member.interest_type}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-sans text-[12px] text-ink">
                      {dev ? (
                        dev.slug ? (
                          <a
                            href={`/admin/listings/${dev.id}`}
                            className="text-navy hover:text-orange transition-colors"
                          >
                            {dev.name}
                          </a>
                        ) : (
                          dev.name
                        )
                      ) : (
                        <span className="text-ink/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-sans text-[12px] text-ink/70">
                      {r.upgrade_type}
                    </td>
                    <td className="px-4 py-3 font-sans text-[12px] text-ink/70 whitespace-nowrap">
                      {r.start_date && r.end_date
                        ? `${r.start_date} → ${r.end_date}`
                        : r.start_date ?? <span className="text-ink/40">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <UpgradeRequestActions
                        id={r.id}
                        status={r.status}
                        notes={r.admin_notes ?? ""}
                      />
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-orange/10 text-orange border-orange/30",
    approved: "bg-green-50 text-green-700 border-green-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    completed: "bg-navy/10 text-navy border-navy/20",
  };
  const cls = styles[status] ?? "bg-ink/5 text-ink/60 border-line";
  return (
    <span
      className={`inline-block font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border ${cls}`}
    >
      {status}
    </span>
  );
}
