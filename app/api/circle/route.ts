import { NextResponse } from "next/server";
import { z } from "zod";

const circleSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email"),
  interest_type: z
    .enum(["Owner-occupier", "Investor", "Developer", "Agent"])
    .optional()
    .nullable(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = circleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
    ) {
      console.log("[DEV] Circle signup:", data);
      return NextResponse.json({ success: true, dev: true }, { status: 201 });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from("circle_signups").upsert(
      {
        full_name: data.full_name,
        email: data.email,
        interest_type: data.interest_type ?? null,
        source: "homepage",
      },
      { onConflict: "email", ignoreDuplicates: true }
    );

    if (error) {
      console.error("Supabase circle signup error:", error);
      return NextResponse.json({ error: "Failed to save signup" }, { status: 500 });
    }

    // TODO: Send welcome email via Resend (Phase 2)

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Circle route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
