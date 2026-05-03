import Link from "next/link";
import { redirect } from "next/navigation";
// import { createClient } from "@/lib/supabase/server";
// Uncomment above and the auth check below when Supabase is connected

const navItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Developments", href: "/admin/developments" },
  { label: "Journal", href: "/admin/journal" },
  { label: "Enquiries", href: "/admin/enquiries" },
  { label: "Members", href: "/admin/members" },
  { label: "Leads", href: "/admin/leads" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Uncomment when Supabase is connected:
  // const supabase = createClient();
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) redirect("/login");
  // const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  // if (!profile?.is_admin) redirect("/");

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <aside className="w-56 bg-navy flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-line-dark">
          <Link href="/" className="font-display text-lg font-light text-ink-light">
            Off The Plan
          </Link>
          <p className="font-mono text-label-sm uppercase tracking-widest text-ink-light/30 mt-0.5">Admin</p>
        </div>
        <nav className="flex flex-col p-4 gap-1 flex-1" aria-label="Admin navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-mono text-label-lg uppercase tracking-widest px-3 py-2 text-ink-light/50 hover:text-ink-light hover:bg-white/5 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-line-dark">
          <Link href="/" className="font-mono text-label-sm uppercase tracking-widest text-ink-light/30 hover:text-ink-light transition-colors">
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-line px-8 py-4">
          <p className="font-mono text-label-sm uppercase tracking-widest text-ink/40">Admin Dashboard</p>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
