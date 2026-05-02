import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/nav-bar";
import { SideRail } from "@/components/side-rail";
import { Footer } from "@/components/footer";

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

export const metadata: Metadata = {
  title: {
    default: "Off The Plan — Australia's Off-The-Plan Property Marketplace",
    template: "%s | Off The Plan",
  },
  description:
    "Australia's curated marketplace for off-the-plan residential real estate. 24,000+ members. Discover new developments before they reach the general market.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://offtheplan.com.au"),
  openGraph: {
    siteName: "Off The Plan",
    locale: "en_AU",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-AU"
      className={`${fraunces.variable} ${jetbrainsMono.variable} ${inter.variable}`}
    >
      <body className="relative overflow-x-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-orange focus:text-white focus:px-4 focus:py-2"
        >
          Skip to main content
        </a>
        <NavBar />
        <SideRail />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
