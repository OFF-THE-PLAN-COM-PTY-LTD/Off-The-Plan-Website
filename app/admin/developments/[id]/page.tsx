import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { DevelopmentForm } from "./development-form";

interface Props { params: { id: string } }

export default async function AdminDevelopmentEditPage({ params }: Props) {
  const isNew = params.id === "new";

  let dev = undefined;

  if (!isNew) {
    const { data } = await supabaseAdmin
      .from("developments")
      .select("id, name, slug, suburb, state, price_display, completion_quarter, beds_min, beds_max, summary, status, is_published, is_featured, hero_image_url")
      .eq("id", params.id)
      .single();
    if (!data) notFound();
    dev = data;
  }

  return <DevelopmentForm id={params.id} existing={dev ?? undefined} />;
}
