import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";
import { sendEmail } from "@/lib/email/send";
import { EMAIL_ADMIN_TO, EMAIL_SALES_CC } from "@/lib/email/client";

/**
 * Public Developer / Agent self-registration endpoint behind /list-a-listing.
 *
 * Mirrors the legacy site's /register flow:
 *   - User fills name + email + password + (developer or agency) toggle
 *   - We create a real Supabase Auth user
 *   - Profile is set to interest_type=Developer/Agent, member_status=pending
 *   - They cannot sign in until an admin approves them via /admin/members
 *   - A developer_lead row is inserted so Tim's existing leads workflow
 *     still surfaces the request alongside the new account
 *
 * Why pending (and not direct access): Developer/Agent accounts can list
 * paid inventory on the public site. Manual approval is the gate. The
 * signup form deliberately doesn't grant the role directly.
 */

const schema = z.object({
  role: z.enum(["agency", "developer"]),
  first_name: z.string().min(1).max(80),
  last_name: z.string().min(1).max(80),
  company: z.string().max(160).optional().nullable(),
  email: z.string().email(),
  phone: z.string().max(40).optional().nullable(),
  password: z.string().min(8).max(200),
  agreed: z.boolean().refine((v) => v === true, { message: "Must agree to terms" }),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
    }
    const { role, first_name, last_name, company, email, phone, password } = parsed.data;
    const fullName = `${first_name} ${last_name}`.trim();
    const interestType = role === "agency" ? "Agent" : "Developer";

    // Use the public signUp method (not admin.createUser) so Supabase's
    // configured SMTP + Confirm-signup email template actually fires.
    // admin.createUser creates the row but DOES NOT trigger any email,
    // even with email_confirm=false. persistSession=false keeps any
    // session token in this server-side client only — no cookies leak
    // back to the user's browser, so they stay logged-out and see the
    // "pending review" message.
    const publicSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    );
    // emailRedirectTo: send the user to a branded "Email confirmed, pending
    // review" page after Supabase verifies their token. Without this they'd
    // land on the home page with no feedback that confirmation worked.
    const origin = new URL(req.url).origin;
    const { data: created, error: createErr } = await publicSupabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${origin}/auth/email-confirmed`,
      },
    });
    if (createErr) {
      console.error("register-as-developer signUp error:", createErr);
      // Surface a specific message for known failure modes rather than the
      // catch-all "email already registered" — that lazy default cost us
      // real debugging time when Supabase SMTP was misconfigured and the
      // actual error was "Error sending confirmation email".
      const msg = (createErr.message || "").toLowerCase();
      let friendly: string;
      if (msg.includes("already registered") || msg.includes("user already")) {
        friendly = "An account with this email already exists. Try signing in instead.";
      } else if (msg.includes("password") && msg.includes("short")) {
        friendly = "Password is too short. Please use at least 8 characters.";
      } else if (msg.includes("sending confirmation") || msg.includes("send email")) {
        friendly = "Your account couldn't be created because we couldn't send the confirmation email. The team has been notified — please try again shortly.";
      } else {
        friendly = `Could not create your account: ${createErr.message || "unknown error"}.`;
      }
      return NextResponse.json({ error: friendly }, { status: 400 });
    }
    const userId = created.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Account created but profile setup failed." }, { status: 500 });
    }

    // Update profile with full role + pending status. The profile row is
    // created by the auth trigger; we update the columns we own.
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: fullName,
        interest_type: interestType,
        business_name: company || null,
        phone: phone || null,
        member_status: "pending",
      })
      .eq("id", userId);
    if (profileErr) {
      console.error("register-as-developer profile update error:", profileErr);
      // Don't fail the whole request — admin can fix in /admin/members.
    }

    // Insert into developer_leads so Tim's existing pipeline still shows
    // the application. Non-fatal if it fails.
    const { error: leadErr } = await supabaseAdmin.from("developer_leads").insert({
      source: "list-a-listing",
      contact_name: fullName,
      email,
      company: company || null,
      phone: phone || null,
      subject: `New ${role} application — account created (pending approval)`,
      message: `Auth user: ${userId}\nRole: ${interestType}\nAwaiting admin approval at /admin/members.`,
      notes: `Auth user: ${userId}\nRole: ${interestType}\nAwaiting admin approval.`,
    });
    if (leadErr) {
      console.error("register-as-developer developer_leads insert (non-fatal):", leadErr);
    }

    // Mirror the new signup into the agencies table so they appear in the
    // unified /admin/agencies view (with portal_status='pending' until an
    // admin approves them). Non-fatal — admin can fix in /admin/agencies.
    const { error: agencyErr } = await supabaseAdmin.from("agencies").insert({
      name: fullName,
      first_name,
      last_name,
      email,
      org_name: company || null,
      mobile: phone || null,
      email_verified: false,
      portal_status: "pending",
    });
    if (agencyErr) {
      console.error("register-as-developer agencies insert (non-fatal):", agencyErr);
    }

    // Notify admin + sales of the new application. Reply-To = the applicant.
    await sendEmail({
      to: EMAIL_ADMIN_TO,
      cc: [EMAIL_SALES_CC],
      replyTo: email,
      subject: `New ${role} application — ${fullName}`,
      html: `<p>A new ${role} application has been submitted via /list-a-listing.</p>
        <p><strong>Name:</strong> ${fullName}<br>
        <strong>Email:</strong> ${email}<br>
        ${company ? `<strong>Company:</strong> ${company}<br>` : ""}
        ${phone ? `<strong>Phone:</strong> ${phone}<br>` : ""}
        <strong>Role:</strong> ${interestType}</p>
        <p>The account is in <strong>pending</strong> state. Approve or reject in
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://offtheplan.com.au"}/admin/members">/admin/members</a>.</p>`,
      text: `New ${role} application: ${fullName} <${email}>${company ? ` (${company})` : ""}${phone ? `, ${phone}` : ""}.\nPending approval at /admin/members.`,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("register-as-developer error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
