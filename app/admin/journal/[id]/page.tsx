import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { JournalForm } from "./journal-form";
import type { JournalArticle } from "@/types/journal";

interface Props {
  params: { id: string };
}

export default async function AdminJournalEditPage({ params }: Props) {
  const isNew = params.id === "new";

  let existing: JournalArticle | undefined;

  if (!isNew) {
    const { data } = await supabaseAdmin
      .from("journal_articles")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();
    if (!data) notFound();
    existing = data as unknown as JournalArticle;
  }

  return <JournalForm id={params.id} existing={existing} />;
}
