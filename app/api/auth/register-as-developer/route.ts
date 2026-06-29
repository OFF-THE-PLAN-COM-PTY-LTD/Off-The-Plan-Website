import { NextResponse } from "next/server";
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

    // Create the auth user (with email confirmation) using the admin API so
    // we can set profile fields atomically afterwards. createUser with
    // email_confirm=false means Supabase still sends the standard
    // verification email.
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name: fullName },
    });
    if (createErr) {
      // Common case: user already registered. Don't leak which — just say
      // we couldn't create the account.
      console.error("register-as-developer createUser error:", createErr);
      return NextResponse.json({ error: "Could not create your account. The email may already be registered." }, { status: 400 });
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
    await supabaseAdmin.from("developer_leads").insert({
      source: "list-a-listing",
      contact_name: fullName,
      email,
      company: company || null,
      phone: phone || null,
      subject: `New ${role} application — account created (pending approval)`,
      message: `Auth user: ${userId}\nRole: ${interestType}\nAwaiting admin approval at /admin/members.`,
      notes: `Auth user: ${userId}\nRole: ${interestType}\nAwaiting admin approval.`,
    }).then((res) => {
      if (res.error) console.error("Lead insert (non-fatal):", res.error);
    });

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
