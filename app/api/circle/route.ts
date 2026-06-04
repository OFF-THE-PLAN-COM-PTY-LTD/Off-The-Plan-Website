import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";
import { sendEmail } from "@/lib/email/send";
import { EMAIL_ADMIN_TO } from "@/lib/email/client";
import { signupNotificationTemplate } from "@/lib/email/templates";

const schema = z.object({
  full_name: z.string().min(1),
  email: z.string().email(),
  interest_type: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    const { error } = await supabaseAdmin.from("circle_signups").insert(parsed.data);
    if (error) {
      // Treat duplicate-email as success to prevent email enumeration via the
      // email UNIQUE constraint. Log the actual error for debugging.
      console.error("Circle signup insert error:", error);
      if (error.code === "23505") {
        return NextResponse.json({ success: true }, { status: 201 });
      }
      return NextResponse.json({ error: "Could not save signup. Please try again." }, { status: 500 });
    }

    // Notify admin (Tim) of the new signup. No-ops cleanly when
    // RESEND_API_KEY isn't set so this is safe to ship before Tim
    // provides the production Resend key.
    const tmpl = signupNotificationTemplate({
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      interest_type: parsed.data.interest_type ?? null,
    });
    await sendEmail({ to: EMAIL_ADMIN_TO, ...tmpl });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
