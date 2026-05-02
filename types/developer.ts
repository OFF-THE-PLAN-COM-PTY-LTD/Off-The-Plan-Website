import type { AustralianState } from "./development";

export interface Developer {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  abn: string | null;
  state: AustralianState | null;
  is_published: boolean;
  created_at: string;
  development_count?: number;
}
