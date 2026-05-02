export type JournalCategory = "Editorial" | "Market" | "Interview" | "Guide";

export interface JournalArticle {
  id: string;
  slug: string;
  title: string;
  category: JournalCategory;
  hero_image_url: string | null;
  body_html: string | null;
  author: string | null;
  read_time_minutes: number | null;
  published_at: string | null;
  is_published: boolean;
  created_at: string;
}
