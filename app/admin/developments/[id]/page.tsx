import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface Props { params: { id: string } }

export default async function AdminDevelopmentEditPage({ params }: Props) {
  const isNew = params.id === "new";

  let dev: Record<string, any> | null = null;

  if (!isNew) {
    const { data } = await supabaseAdmin
      .from("developments")
      .select("id, name, slug, suburb, state, price_display, completion_quarter, beds_min, beds_max, summary, status, is_published, is_featured")
      .eq("id", params.id)
      .single();
    if (!data) notFound();
    dev = data;
  }

  const inputClass = "w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60 transition-colors";

  return (
    <div>
      <Link
        href="/admin/developments"
        className="inline-flex items-center gap-1.5 font-mono text-label-sm uppercase tracking-widest text-ink/40 hover:text-orange transition-colors mb-6"
      >
        ← Back to Developments
      </Link>

      <h1 className="font-display font-light text-navy text-section-lg mb-6">
        {isNew ? "New development" : `Edit: ${dev?.name}`}
      </h1>

      <form action="/api/admin/developments" method="POST" className="flex flex-col gap-5 max-w-2xl">
        <input type="hidden" name="id" value={dev?.id ?? ""} />
        <input type="hidden" name="_method" value={isNew ? "POST" : "PATCH"} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="section-label block mb-1.5">Name *</label>
            <input name="name" type="text" defaultValue={dev?.name ?? ""} required className={inputClass} />
          </div>
          <div>
            <label className="section-label block mb-1.5">Slug *</label>
            <input name="slug" type="text" defaultValue={dev?.slug ?? ""} required className={inputClass} />
          </div>
          <div>
            <label className="section-label block mb-1.5">Suburb</label>
            <input name="suburb" type="text" defaultValue={dev?.suburb ?? ""} className={inputClass} />
          </div>
          <div>
            <label className="section-label block mb-1.5">State</label>
            <select name="state" defaultValue={dev?.state ?? ""} className={inputClass + " cursor-pointer"}>
              <option value="">Select</option>
              {["VIC","NSW","QLD","WA","SA"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="section-label block mb-1.5">Price display</label>
            <input name="price_display" type="text" defaultValue={dev?.price_display ?? ""} placeholder="e.g. From $750K" className={inputClass} />
          </div>
          <div>
            <label className="section-label block mb-1.5">Completion</label>
            <input name="completion_quarter" type="text" defaultValue={dev?.completion_quarter ?? ""} placeholder="e.g. Q4 2027" className={inputClass} />
          </div>
          <div>
            <label className="section-label block mb-1.5">Beds min</label>
            <input name="beds_min" type="number" defaultValue={dev?.beds_min ?? ""} className={inputClass} />
          </div>
          <div>
            <label className="section-label block mb-1.5">Beds max</label>
            <input name="beds_max" type="number" defaultValue={dev?.beds_max ?? ""} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="section-label block mb-1.5">Summary</label>
          <textarea name="summary" rows={3} defaultValue={dev?.summary ?? ""} className={inputClass + " resize-none"} />
        </div>

        <div>
          <label className="section-label block mb-1.5">Status</label>
          <select name="status" defaultValue={dev?.status ?? "Selling now"} className={inputClass + " cursor-pointer"}>
            <option value="Selling now">Selling now</option>
            <option value="Final release">Final release</option>
            <option value="Register interest">Register interest</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="is_published" name="is_published" value="true" defaultChecked={dev?.is_published} className="w-4 h-4 accent-orange" />
          <label htmlFor="is_published" className="section-label cursor-pointer">Published</label>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="is_featured" name="is_featured" value="true" defaultChecked={dev?.is_featured} className="w-4 h-4 accent-orange" />
          <label htmlFor="is_featured" className="section-label cursor-pointer">Featured on homepage</label>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary">{isNew ? "Create development" : "Save changes"}</button>
          <Link href="/admin/developments" className="btn-ghost">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
