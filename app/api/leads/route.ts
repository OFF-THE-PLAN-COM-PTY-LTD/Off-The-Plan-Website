import { NextResponse } from "next/server";
import { z } from "zod";

const leadSchema = z.object({
  contact_name: z.string().min(1).max(200),
  email: z.string().email(),
  company: z.string().max(200).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  development_name: z.string().min(1).max(300),
  suburb: z.string().max(200).optional().nullable(),
  state: z.string().max(10).optional().nullable(),
  residence_count: z.number().int().positive().optional().nullable(),
  expected_completion: z.string().max(50).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
    ) {
      console.log("[DEV] Developer lead:", parsed.data);
      return NextResponse.json({ success: true, dev: true }, { status: 201 });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from("developer_leads").insert(parsed.data);

    if (error) {
      console.error("Supabase lead insert error:", error);
      return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Lead route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
