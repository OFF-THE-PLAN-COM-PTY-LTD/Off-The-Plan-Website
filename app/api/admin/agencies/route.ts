import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth-guards";
import { sendEmail } from "@/lib/email/send";
import { accountApprovedTemplate, accountRejectedTemplate } from "@/lib/email/templates";
import { syncDeveloperFromAgency, unpublishDeveloperForAgency } from "@/lib/developers/sync-from-agency";

async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const target = email.toLowerCase();
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return null;
    const found = data.users.find((u) => u.email?.toLowerCase() === target);
    if (found) return found.id;
    if (data.users.length < 200) break;
  }
  return null;
}

/**
 * When an agency's portal_status changes, mirror it onto the linked
 * profiles.member_status (the login gate) and, on the initial
 * pending → approved/rejected transition only, email the applicant.
 *
 * Best-effort: caller wraps this in try/catch — failures here must not
 * break the admin save. Returns nothing.
 */
async function syncProfileStatusForAgency(agencyId: string, newPortalStatus: string) {
  const { data: agency } = await supabaseAdmin
    .from("agencies").select("email, name").eq("id", agencyId).single();
  if (!agency?.email) return;

  const authUserId = await findAuthUserIdByEmail(agency.email);
  if (!authUserId) return;

  const newMemberStatus =
    newPortalStatus === "active" ? "approved"
    : newPortalStatus === "inactive" ? "rejected"
    : "pending";

  const { data: prev } = await supabaseAdmin
    .from("profiles").select("member_status").eq("id", authUserId).maybeSingle();

  await supabaseAdmin
    .from("profiles").update({ member_status: newMemberStatus }).eq("id", authUserId);

  // Only email on the initial pending → approved/rejected transition.
  // No mail on active↔inactive flips (already-approved users), and none
  // on rejected→approved reactivation (admin chose to do that quietly).
  if (prev?.member_status === "pending" && newMemberStatus !== "pending") {
    const tmpl = newMemberStatus === "approved"
      ? accountApprovedTemplate({ full_name: agency.name ?? "there" })
      : accountRejectedTemplate({ full_name: agency.name ?? "there" });
    await sendEmail({ to: agency.email, ...tmpl });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    const { id, ...fields } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // Validate portal_status if present
    if (fields.portal_status && !["active", "inactive", "pending"].includes(fields.portal_status)) {
      return NextResponse.json({ error: "Invalid portal_status" }, { status: 400 });
    }

    // Validate email format if present — bad input would silently desync the
    // agencies row from the linked Supabase Auth user (line 60 calls
    // updateUserById with this value).
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if ("email" in fields && fields.email != null && fields.email !== "" && !EMAIL_RE.test(fields.email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    if ("org_email" in fields && fields.org_email != null && fields.org_email !== "" && !EMAIL_RE.test(fields.org_email)) {
      return NextResponse.json({ error: "Invalid organisation email format" }, { status: 400 });
    }

    const allowed = [
      "portal_status", "archived",
      "first_name", "last_name", "email", "mobile",
      "personal_street_address", "personal_country", "personal_state", "personal_city", "personal_postcode",
      "org_name", "about", "org_email", "org_phone",
      "org_street_address", "org_street_address_2", "org_country", "org_state", "org_city", "org_postcode",
      "facebook_url", "twitter_url", "instagram_url", "linkedin_url", "pinterest_url", "youtube_url", "website_url",
      "profile_pic", "org_logo_url", "dev_logo_url",
    ];

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (key in fields) update[key] = fields[key] ?? null;
    }

    // Rebuild name from first/last if either changed; also sync auth email if email changed.
    if ("first_name" in fields || "last_name" in fields || "email" in fields) {
      const { data: current } = await supabaseAdmin
        .from("agencies")
        .select("first_name, last_name, email")
        .eq("id", id)
        .single();
      const first = (fields.first_name ?? current?.first_name ?? "").trim();
      const last = (fields.last_name ?? current?.last_name ?? "").trim();
      update.name = `${first} ${last}`.trim() || null;

      // Email change: update the linked Supabase Auth user so they can still log in.
      if ("email" in fields && current?.email && fields.email && fields.email !== current.email) {
        const authUserId = await findAuthUserIdByEmail(current.email);
        if (authUserId) {
          const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
            email: fields.email,
            email_confirm: true,
          });
          if (authErr) {
            return NextResponse.json(
              { error: `Failed to update login email: ${authErr.message}` },
              { status: 500 },
            );
          }
        }
      }
    }

    const { error } = await supabaseAdmin.from("agencies").update(update).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // If portal_status changed, mirror it onto profiles.member_status and
    // email the applicant on the initial approve/reject transition. Best-
    // effort — failures here don't break the admin save.
    if ("portal_status" in fields) {
      try {
        await syncProfileStatusForAgency(id, fields.portal_status);
      } catch (e) {
        console.error("Profile sync / approval email (non-fatal):", e);
      }
    }

    // Keep the public /developers directory consistent with archive state:
    // archiving an agency hides its directory card (soft-delete, row kept);
    // unarchiving republishes it only if it's still a Developer. Best-effort.
    if ("archived" in fields) {
      try {
        if (fields.archived === true) {
          await unpublishDeveloperForAgency(id);
        } else {
          const { data: a } = await supabaseAdmin
            .from("agencies").select("interest_type").eq("id", id).single();
          if (a?.interest_type === "Developer") await syncDeveloperFromAgency(id);
        }
      } catch (e) {
        console.error("Developer directory sync on archive toggle (non-fatal):", e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
