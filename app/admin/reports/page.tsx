import { supabaseAdmin } from "@/lib/supabase/admin";
import ReportsDashboard from "./reports-dashboard";

export default async function ReportsPage() {
  const { data } = await supabaseAdmin
    .from("developments")
    .select("id, name")
    .eq("is_published", true)
    .order("name");

  const developments = (data ?? []).map((d: any) => ({ id: d.id, name: d.name }));

  return <ReportsDashboard developments={developments} />;
}
