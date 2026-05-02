import { NextResponse } from "next/server";
import { z } from "zod";

const enquirySchema = z.object({
  development_id: z.string().uuid("Invalid development ID"),
  full_name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email"),
  mobile: z.string().max(30).optional().nullable(),
  buyer_type: z.enum(["Owner-occupier", "Investor", "Developer", "Agent"]).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = enquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Insert via Supabase service role (swap placeholder check when real keys are set)
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
    ) {
      // Dev mode: log and return success without hitting Supabase
      console.log("[DEV] Enquiry received:", data);
      return NextResponse.json({ success: true, dev: true }, { status: 201 });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from("enquiries").insert({
      development_id: data.development_id,
      full_name: data.full_name,
      email: data.email,
      mobile: data.mobile ?? null,
      buyer_type: data.buyer_type ?? null,
      notes: data.notes ?? null,
    });

    if (error) {
      console.error("Supabase enquiry insert error:", error);
      return NextResponse.json({ error: "Failed to save enquiry" }, { status: 500 });
    }

    // TODO: Send notification email via Resend (Phase 2)

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Enquiry route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
