import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { id, password } = await req.json();
    if (!id || !password) {
      return NextResponse.json({ error: "Missing id or password" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    // Look up the agency email to find their auth account
    const { data: agency } = await supabaseAdmin
      .from("agencies")
      .select("email")
      .eq("id", id)
      .single();

    if (!agency?.email) {
      return NextResponse.json({ error: "Agency has no email on record." }, { status: 404 });
    }

    // Find auth user by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

    const authUser = users.find(u => u.email?.toLowerCase() === agency.email.toLowerCase());
    if (!authUser) {
      return NextResponse.json({ error: "No portal account found for this agency's email." }, { status: 404 });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, { password });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
