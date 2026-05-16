import { supabaseAdmin } from "@/lib/supabase/admin";
import AdsManager from "./ads-manager";

export const dynamic = "force-dynamic";

export default async function AdsPage() {
  const { data } = await supabaseAdmin
    .from("ads")
    .select("*")
    .order("page", { ascending: true })
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  return <AdsManager initial={(data ?? []) as Ad[]} />;
}

export type Ad = {
  id: string;
  page: "home" | "listings" | "resources" | "news" | "guides";
  position: "top" | "middle" | "bottom" | "right";
  ad_type: "image" | "adsense";
  desktop_image_url: string | null;
  mobile_image_url: string | null;
  web_link: string | null;
  adsense_code: string | null;
  is_active: boolean;
  sort_order: number;
};
