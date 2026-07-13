import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getListingEditData } from "@/features/listings/edit-data";
import { ListingForm } from "@/app/admin/listings/[id]/listing-form";

interface Props { params: { id: string } }

export default async function PortalListingEditPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Scoped to owner_user_id so portal users can only load their own listings.
  const data = await getListingEditData(params.id, { ownerUserId: user.id });

  // If listing not found or doesn't belong to this user, 404
  if (!data.existing) notFound();

  // Empty drafts (created by the /portal/listings/new draft-first flow) carry
  // a placeholder name so the DB insert satisfies any NOT NULL constraint.
  // Show it as blank in the form so the user isn't editing over "Untitled listing".
  if ((data.existing.name as string) === "Untitled listing") {
    data.existing.name = "";
  }

  return (
    <ListingForm
      id={params.id}
      existing={data.existing}
      developers={data.developers}
      members={data.members}
      gallery={data.gallery}
      floorPlans={data.floorPlans}
      agents={data.agents}
      isPortal
    />
  );
}
