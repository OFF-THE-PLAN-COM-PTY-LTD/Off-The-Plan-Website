import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Inter, Montserrat, Italiana } from "next/font/google";
import "./globals.css";
import SiteLayout from "@/components/site-layout";
import { createClient } from "@/lib/supabase/server";
import { Analytics } from "@vercel/analytics/next";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["400"],
});

const italiana = Italiana({
  subsets: ["latin"],
  variable: "--font-italiana",
  display: "swap",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: {
    default: "Off The Plan — Australia's Off-The-Plan Property Marketplace",
    template: "%s | Off The Plan",
  },
  description:
    "Australia's curated marketplace for off-the-plan residential real estate. Discover new apartments, townhouses, and land estates before they reach the general market.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://offtheplan.com.au"),
  openGraph: {
    siteName: "Off The Plan",
    locale: "en_AU",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  // getSession reads the cookie locally — no network round-trip on every page load.
  // getUser() was causing ~1s delay per navigation because it verifies the JWT with Supabase.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  let isAdmin = false;
  let isPortalMember = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, interest_type")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.is_admin ?? false;
    isPortalMember = ["Developer", "Agent"].includes(profile?.interest_type ?? "");
  }

  const authUser = user
    ? { name: user.user_metadata?.full_name ?? user.email ?? "Account", isAdmin, isPortalMember }
    : null;

  return (
    <html
      lang="en-AU"
      className={`${fraunces.variable} ${jetbrainsMono.variable} ${inter.variable} ${montserrat.variable} ${italiana.variable}`}
    >
      <body className="relative overflow-x-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-orange focus:text-white focus:px-4 focus:py-2"
        >
          Skip to main content
        </a>
        <SiteLayout user={authUser}>
          {children}
        </SiteLayout>
        <Analytics />
      </body>
    </html>
  );
}
