// Shown instantly while an admin page's server component fetches its data.
// The sidebar (in app/admin/layout.tsx) stays put; only this main area swaps
// to a lightweight skeleton, so sidebar navigation feels immediate instead of
// blank/frozen while the per-request queries run.
export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-56 rounded bg-ink/10" />
        <div className="h-5 w-24 rounded bg-ink/10" />
      </div>

      {/* Filter/tab strip */}
      <div className="flex items-center gap-2 mb-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded bg-ink/10" />
        ))}
      </div>

      {/* Table-ish rows */}
      <div className="bg-white border border-line rounded overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-line last:border-0">
            <div className="h-4 w-8 rounded bg-ink/10" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-ink/10" />
              <div className="h-3 w-1/4 rounded bg-ink/5" />
            </div>
            <div className="h-6 w-20 rounded bg-ink/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
