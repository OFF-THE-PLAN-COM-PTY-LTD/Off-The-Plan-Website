import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email/send";
import { EMAIL_ADMIN_TO, EMAIL_SALES_CC } from "@/lib/email/client";
import { mediaKitRequestTemplate } from "@/lib/email/templates";

/**
 * Public endpoint behind the "Request Media Kit" button on the pricing page.
 * Replaces the previous mailto: link which kicked users into their default
 * mail client. Sends a styled email to admin + sales@ with reply-to set to
 * the submitter so a single reply goes straight back to them.
 */
const schema = z.object({
  full_name: z.string().min(1).max(120),
  email: z.string().email(),
  company: z.string().max(120).optional().nullable(),
  role: z.string().max(80).optional().nullable(),
  notes: z.string().max(1500).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    const { full_name, email, company, role, notes } = parsed.data;

    const tmpl = mediaKitRequestTemplate({
      full_name,
      email,
      company: company ?? null,
      role: role ?? null,
      notes: notes ?? null,
    });

    await sendEmail({
      to: EMAIL_ADMIN_TO,
      cc: [EMAIL_SALES_CC],
      replyTo: email,
      ...tmpl,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[media-kit-request] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
