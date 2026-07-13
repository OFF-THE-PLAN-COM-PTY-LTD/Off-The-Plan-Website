import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import DeveloperForm, { type DeveloperFormValues, type ProfileOption } from "../developer-form";

interface Props { params: { id: string } }

export default async function AdminEditDeveloperPage({ params }: Props) {
  const [{ data: dev }, { data: profilesData }] = await Promise.all([
    supabaseAdmin.from("accounts").select("*").eq("id", params.id).maybeSingle(),
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, business_name, interest_type")
      .eq("interest_type", "Developer")
      .order("business_name", { ascending: true }),
  ]);

  if (!dev) notFound();

  const initial: DeveloperFormValues = {
    id: dev.id as string,
    slug: (dev.slug as string) ?? "",
    name: (dev.name as string) ?? "",
    description: (dev.description as string) ?? "",
    logo_url: (dev.logo_url as string) ?? "",
    website: (dev.website as string) ?? "",
    abn: (dev.abn as string) ?? "",
    state: (dev.state as string) ?? "",
    suburb: (dev.city as string) ?? "",
    company_email: (dev.company_email as string) ?? "",
    phone: (dev.phone as string) ?? "",
    facebook: (dev.facebook as string) ?? "",
    instagram: (dev.instagram as string) ?? "",
    linkedin: (dev.linkedin as string) ?? "",
    pinterest: (dev.pinterest as string) ?? "",
    youtube: (dev.youtube as string) ?? "",
    is_published: Boolean(dev.is_published),
    profile_id: (dev.user_id as string) ?? null,
  };

  const profiles: ProfileOption[] = (profilesData ?? []).map((p) => ({
    id: p.id as string,
    label: (p.business_name as string) || (p.full_name as string) || "Unnamed member",
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-light text-navy text-section-lg">Edit developer</h1>
        <p className="font-sans text-sm text-ink/40 uppercase tracking-widest">{initial.name}</p>
      </div>
      <DeveloperForm initial={initial} profiles={profiles} mode="edit" />
    </div>
  );
}
