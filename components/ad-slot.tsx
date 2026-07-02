import Image from "next/image";
import { supabase } from "@/lib/supabase/public";

type AdPage = "home" | "listings" | "resources" | "news" | "guides";
type AdPosition = "top" | "middle" | "bottom" | "right";

interface Props {
  page: AdPage;
  position: AdPosition;
  className?: string;
}

/**
 * Server component that fetches the first active ad for a (page, position)
 * slot and renders it. Renders nothing when no active ad is configured.
 *
 * Layout by position:
 *  - bottom/top: full-width banner, desktop image hidden on small screens
 *    (300x300 mobile shown instead)
 *  - right:      sidebar skyscraper
 *  - middle:     centered square
 */
export async function AdSlot({ page, position, className = "" }: Props) {
  const { data } = await supabase
    .from("ads")
    .select("desktop_image_url, mobile_image_url, web_link, adsense_code, ad_type")
    .eq("page", page)
    .eq("position", position)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(1);

  const ad = data?.[0];
  if (!ad) return null;

  if (ad.ad_type === "adsense" && ad.adsense_code) {
    return (
      <div className={className} dangerouslySetInnerHTML={{ __html: ad.adsense_code }} />
    );
  }

  if (!ad.desktop_image_url && !ad.mobile_image_url) return null;

  const desktop = ad.desktop_image_url || ad.mobile_image_url || "";
  const mobile = ad.mobile_image_url || ad.desktop_image_url || "";
  const link = ad.web_link || "#";

  // Dimensions per position — match the sizes shown in Admin > Ads Management
  // and Tim's ad master (2026-07-01 email). Desktop image is capped at these
  // exact pixel dimensions on wide screens; the wrapper adds a white buffer
  // around the image so the banner stands out from the cream page background
  // (matches the legacy site's frame around every ad).
  const sizes: Record<AdPosition, { w: number; h: number; mw: number; mh: number; wrap: string }> = {
    bottom: { w: 970, h: 250, mw: 300, mh: 300, wrap: "w-full max-w-[970px] mx-auto" },
    top:    { w: 970, h: 250, mw: 300, mh: 300, wrap: "w-full max-w-[970px] mx-auto" },
    middle: { w: 500, h: 500, mw: 300, mh: 300, wrap: "w-full max-w-[500px] mx-auto" },
    right:  { w: 300, h: 600, mw: 300, mh: 300, wrap: "w-full max-w-[300px]" },
  };
  const s = sizes[position];

  return (
    <div className={`${s.wrap} ${className}`}>
      {/* White buffer / frame — matches legacy. Padding gives the "buffer"
          Tim's email called out (helps the banner stand out from the cream
          page background). The inner image is still capped at the exact
          spec dimensions via the aspectRatio + max-w on the wrapper above. */}
      <div className="bg-white p-3 sm:p-4">
        <a
          href={link}
          target="_blank"
          rel="noopener sponsored"
          className="block group"
          aria-label="Advertisement"
        >
          {/* Desktop — exact aspect ratio, capped by the wrapper's max-w */}
          <div className="hidden sm:block relative mx-auto" style={{ maxWidth: `${s.w}px`, aspectRatio: `${s.w} / ${s.h}` }}>
            <Image
              src={desktop}
              alt="Advertisement"
              fill
              sizes={`${s.w}px`}
              className="object-contain"
              unoptimized={desktop.includes("s3.")}
            />
          </div>
          {/* Mobile — capped at 300 wide, square */}
          <div className="block sm:hidden relative mx-auto" style={{ width: `${s.mw}px`, aspectRatio: `${s.mw} / ${s.mh}` }}>
            <Image
              src={mobile}
              alt="Advertisement"
              fill
              sizes={`${s.mw}px`}
              className="object-contain"
              unoptimized={mobile.includes("s3.")}
            />
          </div>
        </a>
      </div>
    </div>
  );
}
