"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Developments", href: "/search" },
  { label: "Map", href: "/map" },
  { label: "Journal", href: "/journal" },
  { label: "Developers", href: "/developers" },
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
];

interface NavBarProps {
  tone?: "light" | "dark";
  position?: "fixed" | "absolute" | "sticky";
  user?: { name: string } | null;
}

export function NavBar({ tone = "light", position = "fixed", user = null }: NavBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const isDark = tone === "dark";

  return (
    <>
      <header
        className={cn(
          "top-0 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-10 h-16",
          position === "fixed" && "fixed",
          position === "absolute" && "absolute",
          position === "sticky" && "sticky",
          isDark
            ? "bg-transparent text-ink-light"
            : "bg-cream/95 backdrop-blur-sm text-ink border-b border-line"
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <span className={cn("font-display text-xl font-light tracking-tight", isDark ? "text-ink-light" : "text-navy")}>
            Off The Plan
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "font-mono text-label-lg uppercase tracking-widest transition-opacity hover:opacity-60",
                isDark ? "text-ink-light" : "text-ink"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/list-a-development"
            className={cn(
              "font-mono text-label-lg uppercase tracking-widest px-4 py-2 border transition-colors",
              isDark
                ? "border-ink-light/40 text-ink-light hover:bg-ink-light/10"
                : "border-ink/20 text-ink hover:bg-ink/5"
            )}
          >
            List a development
          </Link>
          {user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/saved"
                className={cn("font-mono text-label-lg uppercase tracking-widest transition-opacity hover:opacity-60", isDark ? "text-ink-light" : "text-ink")}
              >
                Saved
              </Link>
              <Link
                href="/account"
                className={cn("font-mono text-label-lg uppercase tracking-widest transition-opacity hover:opacity-60", isDark ? "text-ink-light" : "text-ink")}
              >
                Account
              </Link>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className={cn("font-mono text-label-lg uppercase tracking-widest transition-opacity hover:opacity-60", isDark ? "text-ink-light" : "text-ink")}
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className={cn(
                "font-mono text-label-lg uppercase tracking-widest transition-opacity hover:opacity-60",
                isDark ? "text-ink-light" : "text-ink"
              )}
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
        >
          <span className={cn("block w-6 h-px", isDark ? "bg-ink-light" : "bg-ink")} />
          <span className={cn("block w-6 h-px", isDark ? "bg-ink-light" : "bg-ink")} />
          <span className={cn("block w-4 h-px", isDark ? "bg-ink-light" : "bg-ink")} />
        </button>
      </header>

      {/* Mobile drawer overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-ink/40 z-50 md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 w-72 bg-cream z-50 flex flex-col p-8 transition-transform duration-300 md:hidden",
          menuOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="flex justify-between items-center mb-10">
          <span className="font-display text-lg font-light text-navy">Off The Plan</span>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="p-1 text-ink/60 hover:text-ink"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4L16 16M4 16L16 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-6" aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="font-mono text-label-lg uppercase tracking-widest text-ink hover:text-navy transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-4">
          <Link
            href="/list-a-development"
            onClick={() => setMenuOpen(false)}
            className="font-mono text-label-lg uppercase tracking-widest text-center py-3 bg-orange text-white"
          >
            List a development
          </Link>
          {user ? (
            <>
              <Link href="/saved" onClick={() => setMenuOpen(false)} className="font-mono text-label-lg uppercase tracking-widest text-center py-3 border border-ink/20 text-ink">
                Saved
              </Link>
              <Link href="/account" onClick={() => setMenuOpen(false)} className="font-mono text-label-lg uppercase tracking-widest text-center py-3 border border-ink/20 text-ink">
                Account
              </Link>
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="w-full font-mono text-label-lg uppercase tracking-widest text-center py-3 border border-ink/20 text-ink">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="font-mono text-label-lg uppercase tracking-widest text-center py-3 border border-ink/20 text-ink"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
