import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Draft-first new-listing flow (2026-07-02):
 *
 * Instead of rendering the ListingForm with `id="new"` (which locks the
 * Configuration Summary, Selling Agents, Gallery and Mini Stocklist sections
 * behind a "Save the listing first…" gate), we immediately create an empty
 * draft `developments` row and redirect the user to its edit page. That way
 * every child section works from the first click and the user can fill in
 * the whole form in one uninterrupted pass.
 *
 * If the user already has an existing empty draft (name = the placeholder,
 * still unpublished, nothing filled in), we reuse it — otherwise refreshing
 * this page would create a new orphan row every time.
 *
 * Cleanup of long-abandoned drafts is a separate future task (backlog).
 */

const DRAFT_PLACEHOLDER_NAME = "Untitled listing";

export default async function PortalNewListingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Reuse an existing empty draft if this member already has one. An "empty
  // draft" is defined as: owned by this user, still unpublished, name still
  // the placeholder, and no address filled in yet. If they've started typing
  // anything meaningful we treat it as a real listing and don't reuse it.
  const { data: existingDraft } = await supabaseAdmin
    .from("developments")
    .select("id")
    .eq("owner_user_id", user.id)
    .eq("is_published", false)
    .eq("name", DRAFT_PLACEHOLDER_NAME)
    .is("suburb", null)
    .is("street_address", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingDraft?.id) {
    redirect(`/portal/listings/${existingDraft.id}/edit`);
  }

  // Create a fresh empty draft. Slug is a throwaway based on user id + time —
  // the real slug is generated when the user saves with a real name.
  const draftSlug = `draft-${user.id.slice(0, 8)}-${Date.now()}`;
  const { data: created, error } = await supabaseAdmin
    .from("developments")
    .insert({
      owner_user_id: user.id,
      name: DRAFT_PLACEHOLDER_NAME,
      slug: draftSlug,
      is_published: false,
      is_featured: false,
    })
    .select("id")
    .single();

  if (error || !created) {
    // Something's wrong (RLS, constraint, whatever) — fall back to the
    // legacy behaviour rather than block the user completely. They can
    // still create a listing the old way; we log so we notice.
    console.error("Draft-first: failed to create empty draft:", error);
    redirect("/portal/listings?draftError=1");
  }

  redirect(`/portal/listings/${created.id}/edit`);
}
