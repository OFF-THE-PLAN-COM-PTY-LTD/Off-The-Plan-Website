import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Middleware guarantees user exists here, but type-guard just in case
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, interest_type, is_circle_member, joined_at")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-cream pt-16">
      <div className="container-padded py-14 max-w-lg">
        <h1 className="font-display font-light text-navy text-section-xl mb-2">Account</h1>
        {profile?.joined_at && (
          <p className="font-mono text-label-sm text-ink/30 uppercase tracking-widest mb-10">
            Member since {new Date(profile.joined_at).toLocaleDateString("en-AU", { month: "long", year: "numeric" })}
          </p>
        )}

        <ProfileForm
          fullName={profile?.full_name ?? user.user_metadata?.full_name ?? ""}
          email={user.email ?? ""}
          interestType={profile?.interest_type ?? null}
        />

        <div className="border-t border-line pt-6 mt-8 flex flex-col gap-4">
          <Link href="/saved" className="font-mono text-label-lg uppercase tracking-widest text-ink/60 hover:text-navy transition-colors">
            View saved developments →
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="font-mono text-label-lg uppercase tracking-widest text-ink/40 hover:text-orange transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
