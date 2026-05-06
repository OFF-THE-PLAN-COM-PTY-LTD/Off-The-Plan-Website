"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  BarChart2,
  UserCircle,
  CreditCard,
  Tag,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "Dashboard",   href: "/portal",           icon: LayoutDashboard },
  { label: "Listings",    href: "/portal/listings",   icon: ListChecks },
  { label: "Reports",     href: "/portal/reports",    icon: BarChart2 },
  { label: "Leads",       href: "/portal/leads",      icon: Users },
  { label: "Profile",     href: "/portal/profile",    icon: UserCircle },
  { label: "Billing",     href: "/portal/billing",    icon: CreditCard },
  { label: "Pricing",     href: "/portal/pricing",    icon: Tag },
];

export default function PortalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col" style={{ background: "#1a2340" }}>
      <div className="px-4 py-4 border-b border-white/10">
        <Link href="/">
          <div className="bg-white rounded px-4 py-3 w-full flex items-center justify-center">
            <img src="/logo.png" alt="Off The Plan" className="w-full h-auto" />
          </div>
        </Link>
      </div>

      <nav className="flex flex-col py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/portal"
              ? pathname === "/portal"
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
  );
}
