import { notFound } from "next/navigation";
import { getListingEditData } from "@/features/listings/edit-data";
import { ListingForm } from "./listing-form";

// Bypass Next.js's App Router cache for this admin edit page. Without this,
// navigating away and back within the router-cache TTL (~30s) serves the
// stale snapshot — mini-stocklist / floor-plan edits appear to "not
// reflect" until a hard refresh, even though the DB is already updated
// and the public listing page shows the new values.
export const dynamic = "force-dynamic";

interface Props { params: { id: string } }

export default async function AdminListingEditPage({ params }: Props) {
  const isNew = params.id === "new";

  const data = await getListingEditData(params.id, { isNew });

  if (!isNew && !data.existing) notFound();

  return (
    <ListingForm
      id={params.id}
      existing={data.existing ?? undefined}
      developers={data.developers}
      members={data.members}
      gallery={data.gallery}
      floorPlans={data.floorPlans}
      agents={data.agents}
    />
  );
}
