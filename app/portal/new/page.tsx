import Link from "next/link";
import { Building2 } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function PortalNew() {
  const { data: dev } = await supabaseAdmin
    .from("developments")
    .select("hero_image_url")
    .eq("is_published", true)
    .not("hero_image_url", "is", null)
    .limit(1)
    .single();

  const bgImage = dev?.hero_image_url ?? null;

  return (
    <div className="relative min-h-[calc(100vh-0px)] flex flex-col -m-6">
      {/* Background */}
      {bgImage && (
        <img
          src={bgImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0" style={{ background: "rgba(20,30,58,0.72)" }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header bar */}
        <div className="px-8 py-5" style={{ background: "#1a2340" }}>
          <h1 className="text-white font-semibold text-base tracking-wide">
            New listing or view active listing
          </h1>
        </div>

        {/* Cards */}
        <div className="flex-1 flex items-start gap-6 p-8">
          <Link
            href="/portal/listings"
            className="flex items-center gap-5 px-8 py-6 w-80 transition-opacity hover:opacity-90"
            style={{ background: "#1a2340" }}
          >
            <div className="w-14 h-14 rounded flex items-center justify-center flex-shrink-0" style={{ background: "#e85d26" }}>
              <Building2 size={28} className="text-white" />
            </div>
            <span className="text-white font-semibold text-lg leading-tight">
              View Active Listing
            </span>
          </Link>

          <Link
            href="/contact"
            className="flex items-center gap-5 px-8 py-6 w-80 transition-opacity hover:opacity-90"
            style={{ background: "#1a2340" }}
          >
            <div className="w-14 h-14 rounded flex items-center justify-center flex-shrink-0" style={{ background: "#e85d26" }}>
              <Building2 size={28} className="text-white" />
            </div>
            <span className="text-white font-semibold text-lg leading-tight">
              Create New Listing
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
