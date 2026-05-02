import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({ development_id: z.string().uuid() });

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const { error } = await supabase
      .from("saved_developments")
      .insert({ user_id: user.id, development_id: parsed.data.development_id });

    if (error && error.code !== "23505") { // 23505 = unique violation (already saved)
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ saved: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const { error } = await supabase
      .from("saved_developments")
      .delete()
      .eq("user_id", user.id)
      .eq("development_id", parsed.data.development_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ saved: false });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
