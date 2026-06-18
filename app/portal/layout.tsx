import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import PortalSidebar from "./portal-sidebar";
import ImpersonationBanner from "./impersonation-banner";

export const metadata = { title: "Member Portal — Off The Plan" };

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("interest_type, member_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !["Developer", "Agent"].includes(profile.interest_type ?? "")) {
    redirect("/");
  }

  // Gate portal access based on admin approval status.
  if (profile.member_status === "pending") redirect("/account/pending");
  if (profile.member_status === "rejected") redirect("/account/rejected");

  return (
    <div className="min-h-screen flex" style={{ background: "#f5f5f5" }}>
      <PortalSidebar />
      <div className="flex-1 overflow-auto">
        <ImpersonationBanner />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
