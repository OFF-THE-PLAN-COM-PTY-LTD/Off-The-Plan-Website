"use client";

import { usePathname } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { CirclePopup } from "@/components/circle-popup";

interface SiteLayoutProps {
  user: { name: string; isAdmin: boolean; isPortalMember: boolean } | null;
  children: React.ReactNode;
}

export default function SiteLayout({ user, children }: SiteLayoutProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isPortal = pathname?.startsWith("/portal");

  if (isAdmin || isPortal) {
    return <>{children}</>;
  }

  return (
    <>
      <NavBar user={user} />
<main id="main-content">{children}</main>
      <Footer />
      <CirclePopup />
    </>
  );
}
