import { createClient } from "@supabase/supabase-js";

// Simple public client for reading published data (no auth/cookies needed)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
