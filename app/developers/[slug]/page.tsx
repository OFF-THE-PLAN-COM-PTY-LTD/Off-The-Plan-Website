import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { PropertyCard } from "@/components/property-card";
import { DeveloperContactForm } from "@/components/developer-contact-form";
import { supabase } from "@/lib/supabase/public";
import type { Developer, DeveloperProfile } from "@/types/developer";
import type { Development } from "@/types/development";

interface Props { params: { slug: string } }

// Render on every request so admin publish/unpublish and agency-sync changes
// reflect immediately instead of being frozen into a static build. Matches
// the homepage convention (app/page.tsx).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: dev } = await supabase
    .from("developers")
    .select("name, description")
    .eq("slug", params.slug)
    .single();
  if (!dev) return { title: "Not Found" };
  return { title: `${dev.name} — Developer`, description: dev.description ?? undefined };
}

// Normalise a stored URL or handle into an https:// link.
function normaliseUrl(value: string | null | undefined, platform: "facebook" | "instagram" | "linkedin" | "pinterest" | "youtube" | "website"): string | null {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  switch (platform) {
    case "facebook":  return `https://facebook.com/${v.replace(/^@/, "")}`;
    case "instagram": return `https://instagram.com/${v.replace(/^@/, "")}`;
    case "linkedin":  return `https://linkedin.com/company/${v.replace(/^@/, "")}`;
    case "pinterest": return `https://pinterest.com/${v.replace(/^@/, "")}`;
    case "youtube":   return `https://youtube.com/${v.replace(/^@/, "")}`;
    case "website":   return `https://${v}`;
  }
}

function SocialIcon({ name }: { name: "facebook" | "instagram" | "linkedin" | "pinterest" | "youtube" | "website" }) {
  switch (name) {
    case "facebook":
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.5 2.9h-2.4v7A10 10 0 0 0 22 12z"/></svg>;
    case "instagram":
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>;
    case "linkedin":
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8 17H5.7v-7H8v7zM6.85 9a1.35 1.35 0 1 1 0-2.7 1.35 1.35 0 0 1 0 2.7zM18 17h-2.3v-3.8c0-.9-.4-1.5-1.2-1.5-.7 0-1 .4-1.2.9-.1.2-.1.5-.1.7V17H10.9V10h2.2v1c.3-.5 1-1.2 2.3-1.2 1.7 0 2.6 1.1 2.6 3.1V17z"/></svg>;
    case "pinterest":
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.7 19.3c-.1-.8-.2-2 0-2.9.2-.8 1.1-5 1.1-5s-.3-.6-.3-1.4c0-1.3.8-2.3 1.7-2.3.8 0 1.2.6 1.2 1.4 0 .8-.5 2.1-.8 3.3-.2 1 .5 1.8 1.5 1.8 1.8 0 3.1-1.9 3.1-4.5 0-2.4-1.7-4-4.1-4-2.8 0-4.5 2.1-4.5 4.3 0 .8.3 1.7.7 2.2.1.1.1.2.1.3l-.3 1.1c0 .2-.2.2-.3.1-1.2-.6-2-2.3-2-3.8 0-3.1 2.2-5.9 6.4-5.9 3.4 0 6 2.4 6 5.6 0 3.3-2.1 6-5.1 6-1 0-1.9-.5-2.2-1.1l-.6 2.3c-.2.9-.8 2-1.2 2.7A10 10 0 1 0 12 2z"/></svg>;
    case "youtube":
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.5s-.2-1.6-.9-2.3c-.9-.9-1.8-.9-2.3-1C16.4 4 12 4 12 4s-4.4 0-7.8.3c-.5 0-1.4 0-2.3 1C1.2 5.9 1 7.5 1 7.5S.8 9.4.8 11.3v1.8c0 1.9.2 3.8.2 3.8s.2 1.6.9 2.3c.9.9 2 .9 2.5 1 1.8.2 7.6.3 7.6.3s4.4 0 7.8-.3c.5 0 1.4 0 2.3-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.8v-1.8c0-1.9-.2-3.8-.2-3.8zM9.7 14.7V8.3l5.7 3.2-5.7 3.2z"/></svg>;
    case "website":
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>;
  }
}

export default async function DeveloperProfilePage({ params }: Props) {

  const { data: rawDev } = await supabase
    .from("developers")
    .select("*")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .single();

  if (!rawDev) notFound();
  const dev = rawDev as unknown as Developer;

  // Linked-profile data (if any) takes precedence over the developer row's own
  // admin-edited fields. This lets a Developer-member's portal-profile changes
  // flow through automatically, while still letting Tim edit migrated rows
  // directly from /admin/developers without a linked profile.
  let profile: DeveloperProfile | null = null;
  if (dev.profile_id) {
    const { data } = await supabase
      .from("profiles")
      .select("business_name, about, company_email, company_phone, company_city, company_state, website, facebook, instagram, linkedin, pinterest, youtube")
      .eq("id", dev.profile_id)
      .maybeSingle();
    profile = (data as unknown as DeveloperProfile) ?? null;
  }

  const { data: devsData } = await supabase
    .from("developments")
    .select("*, developer:developers(*), images:development_images(*), floor_plans:development_floor_plans(*)")
    .eq("developer_id", rawDev.id)
    .eq("is_published", true);

  const devDevelopments = (devsData ?? []) as unknown as Development[];

  // Coalesce: linked profile field → developer row field → null.
  const v = (a: string | null | undefined, b: string | null | undefined) => (a && a.trim()) || (b && b.trim()) || null;

  const displayName  = v(profile?.business_name, dev.name) ?? dev.name;
  const displayBio   = v(profile?.about, dev.description);
  const displayCity  = v(profile?.company_city, dev.suburb);
  const displayState = v(profile?.company_state, dev.state);
  const displayEmail = v(profile?.company_email, dev.company_email);
  const displayPhone = v(profile?.company_phone, dev.phone);
  const websiteUrl   = normaliseUrl(v(profile?.website, dev.website), "website");

  const socials = [
    { name: "facebook"  as const, href: normaliseUrl(v(profile?.facebook,  dev.facebook),  "facebook")  },
    { name: "instagram" as const, href: normaliseUrl(v(profile?.instagram, dev.instagram), "instagram") },
    { name: "linkedin"  as const, href: normaliseUrl(v(profile?.linkedin,  dev.linkedin),  "linkedin")  },
    { name: "pinterest" as const, href: normaliseUrl(v(profile?.pinterest, dev.pinterest), "pinterest") },
    { name: "youtube"   as const, href: normaliseUrl(v(profile?.youtube,   dev.youtube),   "youtube")   },
  ].filter((s) => s.href);

  const monogram = displayName.split(/\s+/).map((w) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();

  // Width-cap the listings grid based on count so single/double listings
  // don't sit lonely on the left of a 3-column track.
  const listingCount = devDevelopments.length;
  const listingsGridClass =
    listingCount === 0 ? ""
      : listingCount === 1 ? "max-w-sm mx-auto"
        : listingCount === 2 ? "grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto"
          : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";

  return (
    <div className="min-h-screen bg-cream pt-16">
      {/* ── Hero ── */}
      <section className="bg-navy py-12 md:py-16">
        <div className="container-padded">
          <Link href="/developers" className="font-mono text-[10px] uppercase tracking-widest text-ink-light/40 hover:text-orange transition-colors inline-block mb-6">
            ← All developers
          </Link>
          <div className="flex items-start gap-6 md:gap-8 flex-wrap">
            <div className="h-24 w-44 bg-white flex items-center justify-center flex-shrink-0">
              {dev.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={dev.logo_url}
                  alt={displayName}
                  className="max-h-[80%] max-w-[80%] object-contain"
                />
              ) : (
                <span className="font-mono text-[20px] font-bold uppercase tracking-widest text-navy select-none">
                  {monogram}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-light text-ink-light text-section-xl break-words">
                {displayName}
              </h1>
              {(displayCity || displayState) && (
                <p className="font-mono text-label-sm text-ink-light/50 uppercase tracking-widest mt-2">
                  {[displayCity, displayState].filter(Boolean).join(", ")}
                </p>
              )}
              {dev.abn && (
                <p className="font-mono text-label-sm text-ink-light/30 uppercase tracking-widest mt-1">
                  ABN {dev.abn}
                </p>
              )}

              {(socials.length > 0 || websiteUrl) && (
                <div className="flex items-center gap-2 mt-5">
                  {websiteUrl && (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Website"
                      className="w-9 h-9 flex items-center justify-center border border-ink-light/30 text-ink-light/70 hover:border-orange hover:text-orange transition-colors"
                    >
                      <SocialIcon name="website" />
                    </a>
                  )}
                  {socials.map((s) => (
                    <a
                      key={s.name}
                      href={s.href!}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.name}
                      className="w-9 h-9 flex items-center justify-center border border-ink-light/30 text-ink-light/70 hover:border-orange hover:text-orange transition-colors"
                    >
                      <SocialIcon name={s.name} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── About (only when there's a bio). Centred so the column never
          looks empty regardless of how long the bio is. ── */}
      {displayBio && (
        <section className="container-padded py-12">
          <div className="max-w-3xl mx-auto">
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-3 text-center">
              About
            </p>
            <div className="font-sans text-body-lg text-ink/75 leading-relaxed whitespace-pre-line text-center">
              {displayBio}
            </div>
          </div>
        </section>
      )}

      {/* ── Current listings — grid width scales with count so 1 or 2
          cards don't sit lonely on the left. ── */}
      <section className="container-padded py-12">
        <h2 className="font-display font-light text-navy text-section-lg mb-6 text-center">
          Current listings
        </h2>
        {listingCount > 0 ? (
          <div className={listingsGridClass}>
            {devDevelopments.map((d) => <PropertyCard key={d.id} development={d} layout="tall" />)}
          </div>
        ) : (
          <p className="font-sans text-body-md text-ink/40 text-center">
            No published listings at this time.
          </p>
        )}
      </section>

      {/* ── Contact band — a full-width cream-alt band that gives the
          form its own visual home. Two columns inside: heading + any
          phone/email on the left, form on the right. Never empty. ── */}
      <section className="bg-cream-alt border-y border-line">
        <div className="container-padded py-14">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-start">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-orange mb-3">
                Get in touch
              </p>
              <h2 className="font-display font-light text-navy text-section-lg leading-tight mb-4">
                Contact {displayName}
              </h2>
              <p className="font-sans text-body-md text-ink/65 max-w-md mb-6">
                Have a question about a project or want more information? Send a message and {displayName} will get back to you.
              </p>
              {(displayPhone || displayEmail) && (
                <div className="space-y-2">
                  {displayPhone && (
                    <p className="font-sans text-sm text-ink/70">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40 mr-2">Phone</span>
                      <a href={`tel:${displayPhone}`} className="hover:text-orange">{displayPhone}</a>
                    </p>
                  )}
                  {displayEmail && (
                    <p className="font-sans text-sm text-ink/70">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40 mr-2">Email</span>
                      <a href={`mailto:${displayEmail}`} className="hover:text-orange">{displayEmail}</a>
                    </p>
                  )}
                </div>
              )}
            </div>
            <div>
              <DeveloperContactForm developerSlug={dev.slug} developerName={displayName} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
