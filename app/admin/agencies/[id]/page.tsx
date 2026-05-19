import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import AgencyProfileForm from "./agency-profile-form";

export default async function AgencyProfilePage({ params }: { params: { id: string } }) {
  const { data: agency } = await supabaseAdmin
    .from("agencies")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!agency) notFound();

  return (
    <div>
      <Link
        href="/admin/agencies"
        className="inline-block font-sans text-sm text-ink/40 hover:text-ink transition-colors mb-4"
      >
        ← All Agencies
      </Link>
      <AgencyProfileForm agency={agency} />
    </div>
  );
}
