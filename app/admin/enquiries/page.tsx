export default function AdminEnquiriesPage() {
  // Swap for real Supabase query when connected
  const enquiries: { id: string; full_name: string; email: string; development_name: string; status: string; created_at: string }[] = [];

  return (
    <div>
      <h1 className="font-display font-light text-navy text-section-lg mb-6">Enquiries</h1>
      {enquiries.length > 0 ? (
        <div className="bg-white border border-line overflow-hidden">
          <table className="w-full text-left">
            <thead><tr className="border-b border-line">
              {["Development","Name","Email","Date","Status"].map((h) => (
                <th key={h} className="font-mono text-label-sm uppercase tracking-widest text-ink/40 px-4 py-3">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {enquiries.map((e) => (
                <tr key={e.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-sans text-body-md">{e.development_name}</td>
                  <td className="px-4 py-3 font-sans text-body-md">{e.full_name}</td>
                  <td className="px-4 py-3 font-mono text-label-sm text-ink/60">{e.email}</td>
                  <td className="px-4 py-3 font-mono text-label-sm text-ink/60">{e.created_at}</td>
                  <td className="px-4 py-3 font-mono text-label-sm text-orange">{e.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="font-sans text-body-md text-ink/40">No enquiries yet. They'll appear here when buyers submit the form.</p>
      )}
    </div>
  );
}
