import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NewsForm } from "./news-form";

interface Props {
  params: { id: string };
}

export default async function NewsEditPage({ params }: Props) {
  const isNew = params.id === "new";

  let existing: any = undefined;

  if (!isNew) {
    const { data } = await supabaseAdmin
      .from("journal_articles")
      .select("id, title, slug, hero_image_url, body_html, is_published, published_at")
      .eq("id", params.id)
      .eq("category", "News")
      .single();
    if (!data) notFound();
    existing = data;
  }

  return <NewsForm id={params.id} existing={existing} />;
}
