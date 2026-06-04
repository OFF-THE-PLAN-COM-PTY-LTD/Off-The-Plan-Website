import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";
import { sendEmail } from "@/lib/email/send";
import { EMAIL_ADMIN_TO, EMAIL_SALES_CC } from "@/lib/email/client";
import { enquiryNotificationTemplate } from "@/lib/email/templates";

const schema = z.object({
  development_id: z.string().uuid(),
  full_name: z.string().min(1),
  email: z.string().email(),
  mobile: z.string().optional().nullable(),
  buyer_type: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("enquiries").insert(parsed.data);
    if (error) {
      console.error("Enquiry insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Notify the development's contact (or admin if no contact on file),
    // CC'ing Tim + sales@. Silently no-ops when RESEND_API_KEY isn't set.
    const { data: dev } = await supabaseAdmin
      .from("developments")
      .select("name, slug, agent_email")
      .eq("id", parsed.data.development_id)
      .maybeSingle();

    if (dev) {
      // Prefer the listing's own agent_email if set; otherwise the
      // notification still reaches Tim via the CC chain so nothing is lost.
      const primaryTo = dev.agent_email && dev.agent_email.includes("@")
        ? dev.agent_email
        : EMAIL_ADMIN_TO;

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://offtheplan.com.au";
      const listingUrl = dev.slug ? `${baseUrl}/listings/${dev.slug}` : null;

      const tmpl = enquiryNotificationTemplate({
        development_name: dev.name ?? "Unknown project",
        development_url: listingUrl,
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        mobile: parsed.data.mobile ?? null,
        buyer_type: parsed.data.buyer_type ?? null,
        notes: parsed.data.notes ?? null,
      });

      // De-dupe CC list — if agent_email was missing we already use admin as the To.
      const cc = [EMAIL_ADMIN_TO, EMAIL_SALES_CC].filter((addr) => addr !== primaryTo);

      await sendEmail({
        to: primaryTo,
        cc,
        replyTo: parsed.data.email, // recipient can reply straight to the buyer
        ...tmpl,
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
