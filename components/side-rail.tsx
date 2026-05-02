"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SideRailProps {
  tone?: "light" | "dark";
}

const quickAccessLinks = [
  {
    label: "Search",
    href: "/search",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Map",
    href: "/map",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M9 2C6.239 2 4 4.239 4 7c0 4 5 9 5 9s5-5 5-9c0-2.761-2.239-5-5-5z" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="9" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    label: "Saved",
    href: "/saved",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M9 14.5L3 8.5C3 6 4.8 4 7 4c1.1 0 2.1.5 2.8 1.3L9 6l-.2-.7C9.5 4.5 10.5 4 11.5 4c2.2 0 4 2 4 4.5L9 14.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Enquire",
    href: "#enquiry",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="2" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M2 5.5L9 10L16 5.5" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
];

export function SideRail({ tone = "light" }: SideRailProps) {
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrollable = el.scrollHeight - el.clientHeight;
      if (scrollable <= 0) { setScrollPct(0); return; }
      setScrollPct(Math.round((el.scrollTop / scrollable) * 100));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isDark = tone === "dark";

  return (
    <aside
      className={cn(
        "fixed right-6 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col items-center gap-5",
        isDark ? "text-ink-light/60" : "text-ink/40"
      )}
      aria-label="Quick access"
    >
      {quickAccessLinks.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          aria-label={link.label}
          className="hover:text-orange transition-colors"
        >
          {link.icon}
        </Link>
      ))}

      {/* Divider */}
      <div className={cn("w-px h-12", isDark ? "bg-ink-light/20" : "bg-ink/15")} />

      {/* Scroll progress */}
      <div className="flex flex-col items-center gap-1.5">
        <div
          className={cn("w-px h-16 relative overflow-hidden", isDark ? "bg-ink-light/15" : "bg-ink/10")}
          aria-hidden="true"
        >
          <div
            className="absolute top-0 left-0 right-0 bg-orange transition-all duration-100"
            style={{ height: `${scrollPct}%` }}
          />
        </div>
        <span className={cn("font-mono text-label-sm", isDark ? "text-ink-light/40" : "text-ink/30")}>
          {scrollPct}%
        </span>
      </div>
    </aside>
  );
}
