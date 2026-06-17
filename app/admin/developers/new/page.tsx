import { supabaseAdmin } from "@/lib/supabase/admin";
import DeveloperForm, { type DeveloperFormValues, type ProfileOption } from "../developer-form";

export default async function AdminNewDeveloperPage() {
  const { data: profilesData } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, business_name, interest_type")
    .eq("interest_type", "Developer")
    .order("business_name", { ascending: true });

  const initial: DeveloperFormValues = {
    slug: "",
    name: "",
    description: "",
    logo_url: "",
    website: "",
    abn: "",
    state: "",
    is_published: false,
    profile_id: null,
  };

  const profiles: ProfileOption[] = (profilesData ?? []).map((p) => ({
    id: p.id as string,
    label: (p.business_name as string) || (p.full_name as string) || "Unnamed member",
  }));

  return (
    <div>
      <h1 className="font-display font-light text-navy text-section-lg mb-6">Add developer</h1>
      <DeveloperForm initial={initial} profiles={profiles} mode="new" />
    </div>
  );
}
