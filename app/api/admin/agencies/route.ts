import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth-guards";
import { updateAccountAttributed } from "@/lib/supabase/attributed-writes";
import { revalidatePublicTables } from "@/lib/cache-tags";
import { sendEmail } from "@/lib/email/send";
import { accountApprovedTemplate, accountRejectedTemplate } from "@/lib/email/templates";

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
async function syncAccountMemberStatus(
  account: { email: string | null; user_id: string | null; name: string | null; first_name?: string | null; last_name?: string | null },
  newPortalStatus: string,
) {
  const authUserId = account.user_id ?? (account.email ? await findAuthUserIdByEmail(account.email) : null);
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
  if (prev?.member_status === "pending" && newMemberStatus !== "pending" && account.email) {
    const fullName = [account.first_name, account.last_name].filter(Boolean).join(" ") || account.name || "there";
    const tmpl = newMemberStatus === "approved"
      ? accountApprovedTemplate({ full_name: fullName })
      : accountRejectedTemplate({ full_name: fullName });
    await sendEmail({ to: account.email, ...tmpl });
  }
}

/**
 * Create payload for the trimmed "+ Add profile" form. Company name and type
 * are the only hard requirements — everything else is optional and editable
 * afterwards. Field names match the legacy agency-form shape the edit form
 * already speaks (org_name, mobile, …) so both forms stay consistent.
 */
const createSchema = z.object({
  org_name: z.string().trim().min(1, "Company name is required").max(200),
  type: z.enum(["Developer", "Agent"]),
  first_name: z.string().trim().max(100).optional().default(""),
  last_name: z.string().trim().max(100).optional().default(""),
  email: z.string().trim().email("Invalid email format").max(200).optional().or(z.literal("")),
  mobile: z.string().trim().max(50).optional().default(""),
  org_phone: z.string().trim().max(50).optional().default(""),
  org_state: z.string().trim().max(50).optional().default(""),
});

const slugify = (name: string): string =>
  name.toLowerCase().trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

/**
 * accounts.slug is UNIQUE NOT NULL, so a create has to pick a free one. Probe
 * for a gap rather than relying on the insert to fail, then let POST's retry
 * loop handle the race where someone takes the slug between check and insert.
 */
async function uniqueAccountSlug(base: string): Promise<string> {
  const root = base || "account";
  let candidate = root;
  for (let n = 2; n <= 200; n++) {
    const { data } = await supabaseAdmin
      .from("accounts").select("id").eq("slug", candidate).limit(1);
    if (!(data ?? []).length) return candidate;
    candidate = `${root}-${n}`;
  }
  return `${root}-${Date.now()}`;
}

/**
 * Admin-created profile (the "+ Add profile" button on /admin/agencies).
 *
 * Deliberately record-only: it inserts an `accounts` row and does NOT create a
 * Supabase Auth user or send any email (product decision, 23 Jul 2026). The
 * company shows up in All Profiles and can be linked to listings straight away;
 * giving them a login is a separate, later step. That mirrors the Developer
 * create flow in /api/admin/developers.
 *
 * Logos, socials and address detail are intentionally not accepted here — the
 * create form is trimmed to what a valid record needs, and the rest is filled
 * in afterwards on the existing edit page.
 */
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { org_name, first_name, last_name, email, mobile, org_phone, org_state, type } = parsed.data;

    // An account with a login attached must not be shadowed by a second row
    // carrying the same address — that is exactly the desync the accounts
    // consolidation (046) set out to remove.
    if (email) {
      // Escape LIKE metacharacters before the case-insensitive match — an
      // unescaped "_" is a single-character wildcard, so john_smith@x.com
      // would otherwise collide with johnXsmith@x.com and be refused.
      const pattern = email.replace(/([\\%_])/g, "\\$1");
      const { data: clash } = await supabaseAdmin
        .from("accounts").select("id, name").ilike("email", pattern).limit(1);
      if ((clash ?? []).length) {
        return NextResponse.json(
          { error: `A profile with that email already exists (${clash![0].name ?? "unnamed"}).` },
          { status: 409 },
        );
      }
    }

    // slugify() strips everything non-[a-z0-9], so a wholly non-Latin company
    // name yields "" — fall back through the contact name to a fixed root so
    // the slug can never start with a stray "-".
    const base =
      slugify(org_name) ||
      slugify([first_name, last_name].filter(Boolean).join(" ")) ||
      "account";
    const row = {
      type,
      name: org_name,
      first_name: first_name || null,
      last_name: last_name || null,
      email: email || null,
      phone: mobile || null,
      company_phone: org_phone || null,
      state: org_state || null,
      // Admin-created records start unpublished and inactive: publishing and
      // portal access are explicit follow-up actions on the edit page, so a
      // half-filled profile can never appear in the public directory.
      is_published: false,
      portal_status: "inactive" as const,
      archived: false,
    };

    // Retry on unique-slug collision (23505) in case of a concurrent insert.
    let slug = await uniqueAccountSlug(base);
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await supabaseAdmin
        .from("accounts").insert({ ...row, slug }).select("id").single();
      if (!error) {
        revalidatePublicTables(["accounts"]);
        return NextResponse.json({ id: data.id }, { status: 201 });
      }
      if (error.code !== "23505") {
        console.error("Profile insert error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      slug = `${base}-${Date.now().toString(36)}${attempt}`;
    }
    return NextResponse.json({ error: "Could not allocate a unique slug." }, { status: 500 });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
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

    // Incoming names are the legacy agency-form field names; translate them to
    // the consolidated `accounts` columns. `id` is now the accounts.id.
    const FIELD_MAP: Record<string, string> = {
      portal_status: "portal_status", archived: "archived",
      first_name: "first_name", last_name: "last_name", email: "email", mobile: "phone",
      personal_street_address: "personal_street_address", personal_country: "personal_country",
      personal_state: "personal_state", personal_city: "personal_city", personal_postcode: "personal_postcode",
      org_name: "name", about: "description", org_email: "company_email", org_phone: "company_phone",
      org_street_address: "street_address", org_street_address_2: "street_address_2",
      org_country: "country", org_state: "state", org_city: "city", org_postcode: "postcode",
      facebook_url: "facebook", twitter_url: "twitter", instagram_url: "instagram",
      linkedin_url: "linkedin", pinterest_url: "pinterest", youtube_url: "youtube", website_url: "website",
      profile_pic: "avatar_url", org_logo_url: "logo_url", dev_logo_url: "logo_url",
    };

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [k, col] of Object.entries(FIELD_MAP)) {
      if (k in fields) update[col] = fields[k] ?? null;
    }

    // Archiving revokes portal access (migration 052). The DB trigger enforces
    // this on `accounts` for every writer, but it cannot reach across to
    // `profiles` — so we set it explicitly here too, which routes the change
    // through the syncAccountMemberStatus() mirror below and keeps the login
    // gate (profiles.member_status) in sync. Archive wins over any
    // portal_status sent alongside it. Un-archiving is deliberately NOT the
    // inverse: it never auto-reactivates.
    const archiving = "archived" in fields && fields.archived === true;
    if (archiving) update.portal_status = "inactive";

    // The portal_status this request will land on, if it changes one at all.
    const nextPortalStatus: string | undefined =
      archiving ? "inactive" : "portal_status" in fields ? fields.portal_status : undefined;

    const { data: current } = await supabaseAdmin
      .from("accounts")
      .select("email, user_id, type, portal_status, archived, name, first_name, last_name")
      .eq("id", id)
      .single();
    if (!current) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    // Email change → keep the linked Supabase Auth login in sync.
    if ("email" in fields && current.email && fields.email && fields.email !== current.email) {
      const authUserId = (current.user_id as string | null) ?? await findAuthUserIdByEmail(current.email as string);
      if (authUserId) {
        const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
          email: fields.email,
          email_confirm: true,
        });
        if (authErr) {
          return NextResponse.json({ error: `Failed to update login email: ${authErr.message}` }, { status: 500 });
        }
      }
    }

    // Directory visibility. An explicit is_published from the admin's Developer
    // Publish/Hide toggle wins; otherwise re-derive it when status/archive change
    // (an active, non-archived Developer shows; anything else is hidden).
    if (typeof fields.is_published === "boolean") {
      update.is_published = fields.is_published;
    } else if ("portal_status" in fields || "archived" in fields) {
      const nextPortal = nextPortalStatus ?? current.portal_status;
      const nextArchived = "archived" in fields ? fields.archived === true : current.archived === true;
      update.is_published = current.type === "Developer" && nextPortal === "active" && !nextArchived;
    }

    // Attributed write: records the acting admin in audit_log. `auth.user.id`
    // comes from requireAdmin()'s verified session, never from the request body.
    const { error } = await updateAccountAttributed(id, update, { uid: auth.user.id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePublicTables(["accounts"]);

    // Mirror portal_status → profiles.member_status (the login gate) and email
    // the applicant on the initial approve/reject transition. Best-effort.
    if (nextPortalStatus !== undefined) {
      try {
        await syncAccountMemberStatus(
          current as { email: string | null; user_id: string | null; name: string | null; first_name?: string | null; last_name?: string | null },
          nextPortalStatus,
        );
      } catch (e) {
        console.error("member_status mirror / approval email (non-fatal):", e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
