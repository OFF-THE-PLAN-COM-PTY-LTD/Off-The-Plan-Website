"use client";

import { usePathname } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { SideRail } from "@/components/side-rail";
import { Footer } from "@/components/footer";
import { CirclePopup } from "@/components/circle-popup";

interface SiteLayoutProps {
  user: { name: string; isAdmin: boolean; isPortalMember: boolean } | null;
  children: React.ReactNode;
}

export default function SiteLayout({ user, children }: SiteLayoutProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <NavBar user={user} />
      <SideRail />
      <main id="main-content">{children}</main>
      <Footer />
      <CirclePopup />
    </>
  );
}
