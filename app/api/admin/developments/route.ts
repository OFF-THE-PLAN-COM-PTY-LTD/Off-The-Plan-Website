import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const method = formData.get("_method") as string;
    const id = formData.get("id") as string;

    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      suburb: (formData.get("suburb") as string) || null,
      state: (formData.get("state") as string) || null,
      price_display: (formData.get("price_display") as string) || null,
      completion_quarter: (formData.get("completion_quarter") as string) || null,
      beds_min: formData.get("beds_min") ? Number(formData.get("beds_min")) : null,
      beds_max: formData.get("beds_max") ? Number(formData.get("beds_max")) : null,
      summary: (formData.get("summary") as string) || null,
      status: (formData.get("status") as string) || "Selling now",
      is_published: formData.get("is_published") === "true",
      is_featured: formData.get("is_featured") === "true",
    };

    if (!data.name || !data.slug) {
      return NextResponse.redirect(new URL("/admin/developments", req.url));
    }

    if (method === "PATCH" && id) {
      await supabaseAdmin.from("developments").update(data).eq("id", id);
    } else {
      await supabaseAdmin.from("developments").insert(data);
    }

    return NextResponse.redirect(new URL("/admin/developments", req.url));
  } catch (err) {
    console.error("Development save error:", err);
    return NextResponse.redirect(new URL("/admin/developments", req.url));
  }
}
