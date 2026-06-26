import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";
import { sendEmail } from "@/lib/email/send";
import { EMAIL_ADMIN_TO, EMAIL_SALES_CC } from "@/lib/email/client";
import { developerContactTemplate } from "@/lib/email/templates";

/**
 * Public contact form on /developers/[slug].
 *
 * Routing:
 *   - If developer.profile_id is set → send To the linked profile's
 *     company_email (falling back to user.email, then admin).
 *   - Otherwise → send To admin so leads still reach Tim.
 *   - CC: the buyer + sales@ (so the sender has a record and ops can track).
 *   - Reply-To: the buyer, so a reply goes straight back to them.
 */

const schema = z.object({
  slug: z.string().min(1).max(120),
  full_name: z.string().min(1).max(120),
  email: z.string().email(),
  mobile: z.string().max(40).optional().nullable(),
  message: z.string().min(1).max(4000),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { slug, full_name, email, mobile, message } = parsed.data;

    // Resolve the developer by slug (must be published).
    const { data: dev } = await supabaseAdmin
      .from("developers")
      .select("id, name, slug, profile_id, is_published, company_email")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (!dev) {
      return NextResponse.json({ error: "Developer not found" }, { status: 404 });
    }

    // Where to deliver, in priority order:
    //   1. Linked profile's company_email
    //   2. Linked profile's auth user email
    //   3. The developer row's own company_email (admin-edited)
    //   4. Admin fallback (so leads still reach Tim).
    let primaryTo: string = EMAIL_ADMIN_TO;
    if (dev.profile_id) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("company_email")
        .eq("id", dev.profile_id)
        .maybeSingle();
      if (profile?.company_email && profile.company_email.includes("@")) {
        primaryTo = profile.company_email as string;
      } else {
        const { data: userRow } = await supabaseAdmin.auth.admin.getUserById(dev.profile_id);
        const userEmail = userRow.user?.email;
        if (userEmail && userEmail.includes("@")) primaryTo = userEmail;
      }
    }
    if (primaryTo === EMAIL_ADMIN_TO && dev.company_email && dev.company_email.includes("@")) {
      primaryTo = dev.company_email as string;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://offtheplan.com.au";
    const developerUrl = `${baseUrl}/developers/${dev.slug}`;

    const tmpl = developerContactTemplate({
      developer_name: dev.name ?? "Developer",
      developer_url: developerUrl,
      full_name,
      email,
      mobile: mobile ?? null,
      message,
    });

    // CC list per Tim's PDF spec for I16: "cc me/sales@" — so admin (Tim)
    // AND sales@ are CC'd on every developer-contact email, plus the sender
    // gets a copy for their own records. De-duped against primaryTo so
    // nobody receives the same email twice.
    const cc = Array.from(new Set([email, EMAIL_ADMIN_TO, EMAIL_SALES_CC])).filter((addr) => addr !== primaryTo);

    await sendEmail({
      to: primaryTo,
      cc,
      replyTo: email,
      ...tmpl,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[developer-contact] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
