import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs/promises'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const LISTINGS_DIR = process.env.LISTINGS_DIR ?? path.join(process.cwd(), 'Off plan 2')
const STORAGE_BUCKET = 'listings'

if (!SUPABASE_URL || SUPABASE_URL.includes('placeholder')) {
  console.error('ERROR: Missing or placeholder NEXT_PUBLIC_SUPABASE_URL in .env.local')
  process.exit(1)
}
if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.includes('placeholder')) {
  console.error('ERROR: Missing or placeholder SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

console.log('Supabase URL:', SUPABASE_URL)
console.log('Listings dir:', LISTINGS_DIR)

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

function mapType(scraped: string): string {
  if (scraped === 'New Apartments') return 'Apartments'
  if (scraped === 'Townhouses') return 'Townhouses'
  if (scraped === 'Commercial') return 'Commercial'
  return scraped
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.pdf') return 'application/pdf'
  return 'application/octet-stream'
}

async function uploadImage(localPath: string, storagePath: string): Promise<string | null> {
  try {
    await fs.access(localPath)
  } catch {
    return null
  }

  const buffer = await fs.readFile(localPath)
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, { contentType: getContentType(localPath), upsert: true })

  if (error) {
    console.warn(`    Upload failed: ${storagePath} — ${error.message}`)
    return null
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

async function migrate() {
  // Verify Supabase connection with a lightweight query
  console.log('\nTesting Supabase connection...')
  const { error: pingErr } = await supabase.from('developments').select('id').limit(1)
  if (pingErr) {
    console.error('Connection test failed:', pingErr.message)
    console.error('Check your NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }
  console.log('Connection OK\n')

  console.log('Deleting existing enquiries (FK dependency)...')
  const { error: enqErr } = await supabase
    .from('enquiries')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (enqErr) {
    console.error('Failed to delete enquiries:', enqErr.message)
    process.exit(1)
  }
  console.log('Enquiries deleted\n')

  console.log('Deleting existing mock developments...')
  const { error: delErr } = await supabase
    .from('developments')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (delErr) {
    console.error('Failed to delete existing developments:', delErr.message)
    process.exit(1)
  }
  console.log('Existing developments deleted\n')

  const entries = await fs.readdir(LISTINGS_DIR, { withFileTypes: true })
  const listingDirs = entries
    .filter(e => e.isDirectory())
    .map(e => e.name)

  console.log(`Found ${listingDirs.length} listing directories\n`)

  const processedSlugs = new Set<string>()
  let successCount = 0
  let skipCount = 0

  for (const dirName of listingDirs) {
    const jsonPath = path.join(LISTINGS_DIR, dirName, `${dirName}.json`)

    let raw: string
    try {
      raw = await fs.readFile(jsonPath, 'utf-8')
    } catch {
      console.log(`SKIP ${dirName} — no JSON file found`)
      skipCount++
      continue
    }

    const data = JSON.parse(raw)
    const overview = data.project_overview
    const slug: string = overview?.slug ?? ''
    const name: string = overview?.name ?? ''

    if (!slug || !name) {
      console.log(`SKIP ${dirName} — no slug or name`)
      skipCount++
      continue
    }

    if (processedSlugs.has(slug)) {
      console.log(`SKIP duplicate: ${slug}`)
      skipCount++
      continue
    }
    processedSlugs.add(slug)

    console.log(`Processing: ${name} (${slug})`)

    // Upsert developer
    const devName: string = overview.developer_name ?? 'Unknown Developer'
    const devSlug = slugify(devName)
    const { data: devRecord, error: devUpsertErr } = await supabase
      .from('developers')
      .upsert(
        { slug: devSlug, name: devName, website: overview.developer_website ?? null, is_published: true },
        { onConflict: 'slug' }
      )
      .select('id')
      .single()

    if (devUpsertErr) {
      console.warn(`  Developer upsert failed: ${devUpsertErr.message}`)
    }

    // Upload developer logo
    let logoUrl: string | null = null
    if (overview.logo_url) {
      const localLogo = path.join(LISTINGS_DIR, dirName, overview.logo_url)
      const ext = path.extname(localLogo)
      logoUrl = await uploadImage(localLogo, `${slug}/developer_logo${ext}`)
      if (logoUrl && devRecord) {
        await supabase.from('developers').update({ logo_url: logoUrl }).eq('id', devRecord.id)
      }
    }

    // Upload hero image
    let heroUrl: string | null = null
    if (data.uploads?.hero_image_url) {
      const localHero = path.join(LISTINGS_DIR, dirName, data.uploads.hero_image_url)
      const ext = path.extname(localHero)
      heroUrl = await uploadImage(localHero, `${slug}/hero${ext}`)
    }

    // Upload feature image
    let featureUrl: string | null = null
    if (data.uploads?.feature_image_url) {
      const localFeature = path.join(LISTINGS_DIR, dirName, data.uploads.feature_image_url)
      const ext = path.extname(localFeature)
      featureUrl = await uploadImage(localFeature, `${slug}/feature${ext}`)
    }

    const pricing = overview.pricing_and_dates ?? data.pricing_and_dates ?? {}
    const config = data.configuration_summary ?? {}
    const visibility = overview.visibility ?? {}

    // Upsert development
    const { data: devRow, error: insertErr } = await supabase
      .from('developments')
      .upsert(
        {
          slug,
          name,
          suburb: overview.address?.suburb ?? null,
          state: overview.address?.state ?? null,
          price_from: pricing.price_from != null ? pricing.price_from * 100 : null,
          price_display: pricing.price_display ?? null,
          beds_min: config.beds_min ?? null,
          beds_max: config.beds_max ?? null,
          completion_quarter: pricing.completion_quarter ?? null,
          type: mapType(data.category?.type ?? ''),
          developer_id: devRecord?.id ?? null,
          tier: data.category?.tier ?? null,
          status: visibility.status ?? null,
          summary: overview.description_text ?? null,
          lifestyle: data.property_features?.lifestyle ?? null,
          architect: data.additional_details?.architect ?? null,
          interiors: data.additional_details?.interiors ?? null,
          landscape: data.additional_details?.landscape ?? null,
          builder: data.additional_details?.builder ?? null,
          levels: config.levels ?? null,
          residence_count: overview.residence_count ?? null,
          lat: visibility.lat ?? null,
          lng: visibility.lng ?? null,
          is_published: true,
          is_featured: Boolean(visibility.is_featured),
          hero_image_url: heroUrl,
          feature_image_url: featureUrl,
          hero_alt_text: data.uploads?.hero_alt_text ?? null,
          description: overview.description_text ?? null,
          configuration_label: pricing.configuration_label ?? null,
          search_price_max: pricing.search_price_max != null ? pricing.search_price_max * 100 : null,
          show_price_on_search: pricing.show_price_on_search ?? true,
          street_address: overview.address?.street_address ?? null,
          street_address_2: overview.address?.street_address_2 ?? null,
          postcode: overview.address?.postcode ?? null,
          country: overview.address?.country ?? null,
          city: overview.address?.city ?? null,
          developer_website: overview.developer_website ?? null,
          logo_url: logoUrl,
          listing_duration: overview.listing_duration ?? null,
        },
        { onConflict: 'slug' }
      )
      .select('id')
      .single()

    if (insertErr || !devRow) {
      console.log(`  FAILED insert: ${insertErr?.message}`)
      skipCount++
      continue
    }

    // Insert development_images
    const imageRecords: object[] = []

    if (heroUrl) {
      imageRecords.push({
        development_id: devRow.id,
        url: heroUrl,
        caption: data.uploads?.hero_alt_text ?? null,
        sort_order: 0,
        is_hero: true,
      })
    }

    for (const img of data.uploads?.gallery ?? []) {
      if (!img.url) continue
      const localImg = path.join(LISTINGS_DIR, dirName, img.url)
      const ext = path.extname(localImg)
      const uploaded = await uploadImage(localImg, `${slug}/gallery-${img.order}${ext}`)
      if (uploaded) {
        imageRecords.push({
          development_id: devRow.id,
          url: uploaded,
          caption: img.alt ?? null,
          sort_order: img.order,
          is_hero: false,
        })
      }
    }

    if (imageRecords.length > 0) {
      const { error: imgErr } = await supabase.from('development_images').insert(imageRecords)
      if (imgErr) console.warn(`  Image insert error: ${imgErr.message}`)
    }

    // Insert floor plans
    const floorPlans = (config.floor_plans ?? []).map((fp: Record<string, unknown>) => ({
      development_id: devRow.id,
      plan_type: null,
      config: fp.beds != null && fp.bath != null ? `${fp.beds} bed, ${fp.bath} bath` : null,
      internal_sqm: fp.internal_sqm ?? null,
      price_from: fp.price_from != null ? (fp.price_from as number) * 100 : null,
      image_url: null,
    }))

    if (floorPlans.length > 0) {
      const { error: fpErr } = await supabase.from('development_floor_plans').insert(floorPlans)
      if (fpErr) console.warn(`  Floor plan insert error: ${fpErr.message}`)
    }

    console.log(`  Done: ${imageRecords.length} images, ${floorPlans.length} floor plans`)
    successCount++
  }

  console.log(`\nMigration complete: ${successCount} imported, ${skipCount} skipped`)
}

migrate().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
