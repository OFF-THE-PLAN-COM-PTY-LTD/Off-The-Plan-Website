"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  Building2,
  Building,
  Users,
  BarChart2,
  Tag,
  Newspaper,
  Globe,
  Megaphone,
  ArrowUpCircle,
  LogOut,
} from "lucide-react";

// Note: /admin/leads and /admin/enquiries routes exist but are
// redundant — the same data already appears as tables on the
// dashboard (/admin) with filter + export controls. Sidebar links
// to them were removed (Jun 2026) to avoid confusion.
const navItems = [
  { label: "Dashboard",         href: "/admin",                  icon: LayoutDashboard },
  { label: "Listing",           href: "/admin/listings",         icon: ListChecks },
  { label: "All Agencies",      href: "/admin/agencies",         icon: Building2 },
  { label: "Developers",        href: "/admin/developers",       icon: Building },
  { label: "Members",           href: "/admin/members",          icon: Users },
  { label: "Reports",           href: "/admin/reports",          icon: BarChart2 },
  { label: "Upgrade Requests",  href: "/admin/upgrade-requests", icon: ArrowUpCircle },
  { label: "Pricing",           href: "/admin/pricing",          icon: Tag },
  { label: "News and Events",   href: "/admin/news-events",      icon: Newspaper },
  { label: "Homepage Setup",    href: "/admin/homepage-setup",   icon: Globe },
  { label: "Ads Management",    href: "/admin/ads",              icon: Megaphone },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex" style={{ background: "#f5f5f5" }}>
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col" style={{ background: "#1a2340" }}>
        {/* Logo */}
        <div className="px-4 py-4 border-b border-white/10">
          <Link href="/">
            <div className="bg-white rounded px-4 py-3 w-full flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Off The Plan"
                className="w-full h-auto"
              />
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex flex-col py-2" aria-label="Admin navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                  active
                    ? "text-white bg-white/10 border-l-2 border-orange-500"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-white/10 p-4">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-3 px-1 py-2 text-sm text-white/50 hover:text-white transition-colors w-full"
            >
              <LogOut size={16} />
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto flex flex-col">
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
