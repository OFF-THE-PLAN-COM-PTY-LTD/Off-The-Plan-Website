import { mockDevelopments } from "@/lib/mock-data";

interface Props { params: { id: string } }

export default function AdminDevelopmentEditPage({ params }: Props) {
  const dev = params.id === "new" ? null : mockDevelopments.find((d) => d.id === params.id);
  const isNew = params.id === "new";

  return (
    <div>
      <h1 className="font-display font-light text-navy text-section-lg mb-6">
        {isNew ? "New development" : `Edit: ${dev?.name ?? "Not found"}`}
      </h1>

      <form action="/api/admin/developments" method="POST" className="flex flex-col gap-5 max-w-2xl">
        <input type="hidden" name="id" value={dev?.id ?? ""} />
        <div className="grid grid-cols-2 gap-4">
          <div><label className="section-label block mb-1.5">Name *</label><input name="name" type="text" defaultValue={dev?.name ?? ""} required className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60" /></div>
          <div><label className="section-label block mb-1.5">Slug *</label><input name="slug" type="text" defaultValue={dev?.slug ?? ""} required className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60" /></div>
          <div><label className="section-label block mb-1.5">Suburb</label><input name="suburb" type="text" defaultValue={dev?.suburb ?? ""} className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60" /></div>
          <div><label className="section-label block mb-1.5">State</label>
            <select name="state" defaultValue={dev?.state ?? ""} className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none cursor-pointer">
              <option value="">Select</option>
              {["VIC","NSW","QLD","WA","SA"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="section-label block mb-1.5">Price display</label><input name="price_display" type="text" defaultValue={dev?.price_display ?? ""} placeholder="e.g. $750K" className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60" /></div>
          <div><label className="section-label block mb-1.5">Completion</label><input name="completion_quarter" type="text" defaultValue={dev?.completion_quarter ?? ""} placeholder="e.g. Q4 2027" className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60" /></div>
          <div><label className="section-label block mb-1.5">Beds min</label><input name="beds_min" type="number" defaultValue={dev?.beds_min ?? ""} className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60" /></div>
          <div><label className="section-label block mb-1.5">Beds max</label><input name="beds_max" type="number" defaultValue={dev?.beds_max ?? ""} className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60" /></div>
        </div>
        <div><label className="section-label block mb-1.5">Summary</label><textarea name="summary" rows={3} defaultValue={dev?.summary ?? ""} className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60 resize-none" /></div>
        <div><label className="section-label block mb-1.5">Status</label>
          <select name="status" defaultValue={dev?.status ?? ""} className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none cursor-pointer">
            <option value="Selling now">Selling now</option>
            <option value="Final release">Final release</option>
            <option value="Register interest">Register interest</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="is_published" name="is_published" defaultChecked={dev?.is_published} className="w-4 h-4" />
          <label htmlFor="is_published" className="section-label">Published</label>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="is_featured" name="is_featured" defaultChecked={dev?.is_featured} className="w-4 h-4" />
          <label htmlFor="is_featured" className="section-label">Featured</label>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn-primary">{isNew ? "Create development" : "Save changes"}</button>
          <a href="/admin/developments" className="btn-ghost">Cancel</a>
        </div>
      </form>
    </div>
  );
}
