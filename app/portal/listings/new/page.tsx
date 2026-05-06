import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ListingForm } from "@/app/admin/listings/[id]/listing-form";

export default async function PortalNewListingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [developersResult, membersResult] = await Promise.all([
    supabaseAdmin.from("developers").select("id, name").order("name"),
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, interest_type")
      .in("interest_type", ["Developer", "Agent"])
      .order("full_name"),
  ]);

  const members = (membersResult.data ?? []).map((m) => ({
    id: m.id as string,
    full_name: m.full_name as string | null,
    interest_type: m.interest_type as string | null,
  }));

  return (
    <ListingForm
      id="new"
      existing={{ owner_user_id: user.id }}
      developers={developersResult.data ?? []}
      members={members}
      gallery={[]}
      floorPlans={[]}
      agents={[]}
      isPortal
    />
  );
}
