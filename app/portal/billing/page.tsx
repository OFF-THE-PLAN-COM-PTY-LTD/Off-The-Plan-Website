import Link from "next/link";
import { CreditCard, FileText } from "lucide-react";

export default function PortalBilling() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl text-ink">Billing</h1>
        <p className="font-sans text-sm text-ink/50 mt-1">Manage your subscription and invoices.</p>
      </div>

      <div className="bg-white p-8 flex flex-col items-center gap-4 text-center">
        <CreditCard size={40} className="text-ink/20" />
        <div>
          <p className="font-sans text-sm text-ink font-medium">Billing managed by the Off The Plan team</p>
          <p className="font-sans text-sm text-ink/50 mt-1 max-w-sm">
            To update your subscription, add a payment method, or request an invoice, please contact us directly.
          </p>
        </div>
        <div className="flex gap-3 mt-2">
          <Link
            href="/contact"
            className="font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 bg-orange text-white hover:bg-orange/90 transition-colors"
          >
            Contact Us
          </Link>
          <Link
            href="/portal/pricing"
            className="font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 border border-ink text-ink hover:bg-ink hover:text-white transition-colors flex items-center gap-2"
          >
            <FileText size={12} />
            View Plans
          </Link>
        </div>
      </div>
    </div>
  );
}
