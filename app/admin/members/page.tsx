export default function AdminMembersPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-light text-navy text-section-lg">Circle Members</h1>
        <button className="btn-ghost">Export CSV</button>
      </div>
      <p className="font-sans text-body-md text-ink/40">
        Member signups will appear here. Connect Supabase to see live data.
      </p>
    </div>
  );
}
