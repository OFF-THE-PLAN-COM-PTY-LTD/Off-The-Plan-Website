import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NewsForm } from "./news-form";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function NewsEditPage({ params }: Props) {
  const isNew = params.id === "new";

  let existing: any = undefined;

  if (!isNew) {
    const { data } = await supabaseAdmin
      .from("journal_articles")
      .select("id, title, slug, subtitle, hero_image_url, list_page_image_url, article_image_one, article_image_two, body_html, is_published, published_at, read_time_minutes, meta_title, meta_content")
      .eq("id", params.id)
      .eq("category", "News")
      .maybeSingle();
    if (!data) notFound();
    existing = data;
  }

  return <NewsForm id={params.id} existing={existing} />;
}
