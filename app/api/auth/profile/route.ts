import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// SECURITY: mirrors the allowlist in /api/auth/signup. Without this, the
// public PATCH endpoint was a self-promotion vector — any signed-in user
// could PATCH their own profile with interest_type='Developer' and the
// next login would route them to /portal. The trigger in migration 025
// intentionally doesn't protect interest_type at the DB level, so the
// guard lives here.
const SELF_ALLOWED_INTERESTS = new Set(["Buyer", "Owner-occupier", "Investor"]);

const schema = z.object({
  full_name: z.string().min(1),
  interest_type: z.string().nullable().optional(),
});

export async function PATCH(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Strip any client-supplied interest_type that isn't a permitted
    // self-grant value. We deliberately update full_name only by default
    // and only carry interest_type through if it's on the allowlist.
    const update: Record<string, unknown> = { full_name: parsed.data.full_name };
    if (parsed.data.interest_type !== undefined) {
      const t = parsed.data.interest_type;
      if (t === null || SELF_ALLOWED_INTERESTS.has(t)) {
        update.interest_type = t;
      }
      // Else: silently drop — don't acknowledge an attempted privilege grant.
    }

    const { error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
