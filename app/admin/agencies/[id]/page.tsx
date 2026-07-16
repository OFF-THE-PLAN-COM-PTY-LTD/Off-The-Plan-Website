import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import AgencyProfileForm from "./agency-profile-form";

export default async function AgencyProfilePage({ params }: { params: { id: string } }) {
  const { data: account } = await supabaseAdmin
    .from("accounts")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!account) notFound();

  // Adapt the consolidated `accounts` row back to the legacy agency-form shape
  // the client component reads. Writes go through PATCH /api/admin/agencies,
  // which maps these same field names back onto accounts columns (FIELD_MAP).
  const agency = {
    id: account.id,
    name: account.name,
    email: account.email,
    first_name: account.first_name,
    last_name: account.last_name,
    mobile: account.phone,
    personal_street_address: account.personal_street_address,
    personal_country: account.personal_country,
    personal_state: account.personal_state,
    personal_city: account.personal_city,
    personal_postcode: account.personal_postcode,
    org_name: account.name,
    about: account.description,
    org_email: account.company_email,
    org_phone: account.company_phone,
    org_street_address: account.street_address,
    org_street_address_2: account.street_address_2,
    org_country: account.country,
    org_state: account.state,
    org_city: account.city,
    org_postcode: account.postcode,
    facebook_url: account.facebook,
    instagram_url: account.instagram,
    linkedin_url: account.linkedin,
    pinterest_url: account.pinterest,
    youtube_url: account.youtube,
    website_url: account.website,
    profile_pic: account.avatar_url,
    // accounts consolidates both logo slots into a single logo_url column.
    org_logo_url: account.logo_url,
    dev_logo_url: account.logo_url,
  };

  return (
    <div>
      <Link
        href="/admin/agencies"
        className="inline-block font-sans text-sm text-ink/40 hover:text-ink transition-colors mb-4"
      >
        ← All Agencies
      </Link>
      {/* key={agency.id} forces a remount when navigating between two
          profiles — the form seeds its fields from props on mount, so without
          it a client [id]→[id] navigation would keep the previous agency's
          values (App Router reuses the component instance). */}
      <AgencyProfileForm key={agency.id} agency={agency} />
    </div>
  );
}
