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
  phone?: string | null;
  /** Admin-editable fields (migration 041). Public page renders these only
   *  when no linked profile takes precedence. */
  suburb?: string | null;
  company_email?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  pinterest?: string | null;
  youtube?: string | null;
  is_published: boolean;
  profile_id?: string | null;
  created_at: string;
  development_count?: number;
}

/** Subset of `profiles` columns surfaced on the public /developers/[slug] page. */
export interface DeveloperProfile {
  business_name: string | null;
  about: string | null;
  company_email: string | null;
  company_phone: string | null;
  company_city: string | null;
  company_state: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  pinterest: string | null;
  youtube: string | null;
}
