import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const data = {
      contact_name: (formData.get("contact_name") as string)?.trim(),
      email: (formData.get("email") as string)?.trim(),
      company: (formData.get("company") as string)?.trim() || null,
      phone: (formData.get("phone") as string)?.trim() || null,
      development_name: (formData.get("development_name") as string)?.trim(),
      suburb: (formData.get("suburb") as string)?.trim() || null,
      state: (formData.get("state") as string) || null,
      residence_count: formData.get("residence_count") ? Number(formData.get("residence_count")) : null,
      expected_completion: (formData.get("expected_completion") as string)?.trim() || null,
      notes: (formData.get("notes") as string)?.trim() || null,
    };

    if (!data.contact_name || !data.email || !data.development_name) {
      return NextResponse.redirect(new URL("/list-a-development?error=1", req.url));
    }

    const { error } = await supabaseAdmin.from("developer_leads").insert(data);
    if (error) {
      console.error("Developer lead insert error:", error);
      return NextResponse.redirect(new URL("/list-a-development?error=1", req.url));
    }

    return NextResponse.redirect(new URL("/list-a-development?submitted=1", req.url));
  } catch (err) {
    console.error("Leads route error:", err);
    return NextResponse.redirect(new URL("/list-a-development?error=1", req.url));
  }
}
