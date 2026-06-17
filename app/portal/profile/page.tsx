import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ManageProfileForm } from "./profile-form";

export default async function PortalProfile() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select(`
      full_name, avatar_url, interest_type,
      first_name, last_name, phone,
      street_address, street_address_2, country, state, city, postcode,
      business_name, about,
      company_email, company_phone,
      company_street, company_street_2, company_country, company_state, company_city, company_postcode,
      company_logo_url, developer_logo_url,
      facebook, instagram, linkedin, pinterest, youtube, website
    `)
    .eq("id", user.id)
    .maybeSingle();

  // Check if this developer-member already has a directory entry, and whether it's published.
  const isDeveloperMember = (profile?.interest_type as string) === "Developer";
  let directoryOptedIn = false;
  if (isDeveloperMember) {
    const { data: linkedDev } = await supabaseAdmin
      .from("developers")
      .select("is_published")
      .eq("profile_id", user.id)
      .maybeSingle();
    directoryOptedIn = Boolean(linkedDev?.is_published);
  }

  return (
    <div>
      {/* Page header */}
      <div className="px-1 py-3 mb-6" style={{ background: "#1a2340" }}>
        <h1 className="text-white font-semibold text-base px-4">Manage Profile</h1>
      </div>

      <ManageProfileForm
        profile={{
          avatar_url: (profile?.avatar_url as string) ?? null,
          full_name: (profile?.full_name as string) ?? null,
          email: user.email ?? "",
          first_name: (profile?.first_name as string) ?? null,
          last_name: (profile?.last_name as string) ?? null,
          phone: (profile?.phone as string) ?? null,
          street_address: (profile?.street_address as string) ?? null,
          street_address_2: (profile?.street_address_2 as string) ?? null,
          country: (profile?.country as string) ?? null,
          state: (profile?.state as string) ?? null,
          city: (profile?.city as string) ?? null,
          postcode: (profile?.postcode as string) ?? null,
          business_name: (profile?.business_name as string) ?? null,
          about: (profile?.about as string) ?? null,
          company_email: (profile?.company_email as string) ?? null,
          company_phone: (profile?.company_phone as string) ?? null,
          company_street: (profile?.company_street as string) ?? null,
          company_street_2: (profile?.company_street_2 as string) ?? null,
          company_country: (profile?.company_country as string) ?? null,
          company_state: (profile?.company_state as string) ?? null,
          company_city: (profile?.company_city as string) ?? null,
          company_postcode: (profile?.company_postcode as string) ?? null,
          company_logo_url: (profile?.company_logo_url as string) ?? null,
          developer_logo_url: (profile?.developer_logo_url as string) ?? null,
          facebook: (profile?.facebook as string) ?? null,
          instagram: (profile?.instagram as string) ?? null,
          linkedin: (profile?.linkedin as string) ?? null,
          pinterest: (profile?.pinterest as string) ?? null,
          youtube: (profile?.youtube as string) ?? null,
          website: (profile?.website as string) ?? null,
        }}
        developerDirectory={{ eligible: isDeveloperMember, optedIn: directoryOptedIn }}
      />
    </div>
  );
}
