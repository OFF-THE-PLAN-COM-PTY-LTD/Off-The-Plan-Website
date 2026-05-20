import type { Metadata } from "next";

export const metadata: Metadata = { title: "Account Not Approved — Off The Plan" };

export default function RejectedPage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center py-16">
        <p className="font-mono text-[10px] uppercase tracking-widest text-orange mb-4">
          Status
        </p>
        <h1 className="font-display font-light text-navy text-4xl mb-4">
          Account Not Approved
        </h1>
        <div className="w-12 h-px bg-orange mx-auto mb-6" />
        <p className="font-sans text-sm text-ink/70 leading-relaxed mb-8">
          Unfortunately your account request was not approved. Contact{" "}
          <a
            href="mailto:tim@offtheplan.com.au"
            className="text-navy underline underline-offset-2 hover:text-orange transition-colors"
          >
            tim@offtheplan.com.au
          </a>{" "}
          if you think this is an error.
        </p>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="font-mono text-[10px] uppercase tracking-widest text-ink/40 hover:text-orange transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
