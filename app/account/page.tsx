import type { Metadata } from "next";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-cream pt-16">
      <div className="container-padded py-14 max-w-lg">
        <h1 className="font-display font-light text-navy text-section-xl mb-10">Account</h1>
        {/* Profile form — swap for real data when Supabase is connected */}
        <div className="flex flex-col gap-5">
          <div>
            <label className="section-label block mb-1.5">Full name</label>
            <input type="text" defaultValue="" className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60" />
          </div>
          <div>
            <label className="section-label block mb-1.5">Email</label>
            <input type="email" defaultValue="" disabled className="w-full border border-line px-3 py-2.5 bg-white/50 font-sans text-body-md text-ink/40" />
          </div>
          <div>
            <label className="section-label block mb-1.5">I am a...</label>
            <select className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none cursor-pointer">
              <option>Owner-occupier</option>
              <option>Investor</option>
              <option>Developer</option>
              <option>Agent</option>
            </select>
          </div>
          <button className="btn-primary self-start">Save changes</button>
          <div className="border-t border-line pt-5 mt-2">
            <button className="font-mono text-label-lg uppercase tracking-widest text-ink/40 hover:text-orange transition-colors">
              Unsubscribe from Member Circle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
