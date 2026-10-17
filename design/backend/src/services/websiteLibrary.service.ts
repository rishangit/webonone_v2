import { nanoid } from 'nanoid'
import { z } from 'zod'
import {
  copyPresetDocument,
  linkHomeMenu,
  replaceCompanyName,
} from '../catalog/websiteLibrary.js'
import { db } from '../models/db.js'
import { HttpError } from './httpError.js'
import { getCompanyFromWebOnOne } from './webononeCompanyClient.js'
import {
  websiteDocumentSchema,
  type WebsiteDocumentV1,
} from '../schemas/websiteDocument.schema.js'
import {
  websiteButtonStyleSchema,
  websiteColorTokenSchema,
  websiteFontTokenSchema,
  websiteTextStyleSchema,
} from '../schemas/websiteThemes.schema.js'

const starterThemeSchema = z.object({
  name: z.string().min(1),
  pageBackground: z.string().min(1),
  bodyTextColor: z.string().min(1),
  fonts: z.array(websiteFontTokenSchema),
  colors: z.array(websiteColorTokenSchema),
  textStyles: z.array(websiteTextStyleSchema),
  buttonStyles: z.array(websiteButtonStyleSchema),
})

const starterPresetSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  document: websiteDocumentSchema,
})

export type FontLibraryItem = {
  id: string
  name: string
  googleFontUrl: string
  family: string
  sortOrder: number
}

type FontLibraryRow = {
  id: string
  name: string
  google_font_url: string
  family: string
  sort_order: number
  is_active: boolean | number
}

function toFontLibraryItem(row: FontLibraryRow): FontLibraryItem {
  return {
    id: row.id,
    name: row.name,
    googleFontUrl: row.google_font_url,
    family: row.family,
    sortOrder: row.sort_order,
  }
}

function parseJson(raw: unknown): unknown {
  if (typeof raw === 'string') return JSON.parse(raw) as unknown
  return raw
}

export async function listFontLibrary(input: {
  page?: number
  pageSize?: number
  q?: string
}): Promise<{ items: FontLibraryItem[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 48))
  const offset = (page - 1) * pageSize
  let query = db<FontLibraryRow>('design_website_font_library').where('is_active', true)
  if (input.q?.trim()) {
    const q = `%${input.q.trim().toLowerCase()}%`
    query = query.andWhere((builder) => {
      builder.whereRaw('LOWER(name) LIKE ?', [q]).orWhereRaw('LOWER(family) LIKE ?', [q])
    })
  }
  const countRow = await query.clone().count<{ count: number | string }[]>({ count: '*' }).first()
  const total = Number(countRow?.count ?? 0)
  const rows = await query.clone().orderBy('sort_order', 'asc').limit(pageSize).offset(offset)
  return {
    items: rows.map(toFontLibraryItem),
    total,
    page,
    pageSize,
  }
}

export async function createFontLibraryItem(input: {
  name: string
  googleFontUrl: string
  family: string
}): Promise<FontLibraryItem> {
  const existing = await db<FontLibraryRow>('design_website_font_library')
    .where({ google_font_url: input.googleFontUrl })
    .first()
  if (existing) {
    if (!existing.is_active) {
      await db('design_website_font_library').where({ id: existing.id }).update({
        is_active: true,
        name: input.name,
        family: input.family,
      })
    }
    const row = await db<FontLibraryRow>('design_website_font_library').where({ id: existing.id }).first()
    if (!row) throw new HttpError(500, 'Could not save the font', 'FONT_LIBRARY_SAVE_FAILED')
    return toFontLibraryItem(row)
  }

  const maxRow = await db('design_website_font_library').max<{ max: number | string | null }>('sort_order as max').first()
  const sortOrder = Number(maxRow?.max ?? 0) + 1
  const id = nanoid()
  await db('design_website_font_library').insert({
    id,
    name: input.name,
    google_font_url: input.googleFontUrl,
    family: input.family,
    sort_order: sortOrder,
    is_active: true,
  })
  return {
    id,
    name: input.name,
    googleFontUrl: input.googleFontUrl,
    family: input.family,
    sortOrder,
  }
}

type StoredStarter = {
  theme: z.infer<typeof starterThemeSchema>
  presets: Array<z.infer<typeof starterPresetSchema>>
}

async function loadActiveStarter(): Promise<StoredStarter> {
  const row = await db('design_website_starter_templates')
    .where({ slug: 'default', is_active: true })
    .first()
  if (!row) {
    throw new HttpError(503, 'Starter website template is not configured', 'STARTER_TEMPLATE_MISSING')
  }
  const theme = starterThemeSchema.safeParse(parseJson(row.theme))
  const presets = z.array(starterPresetSchema).safeParse(parseJson(row.presets))
  if (!theme.success || !presets.success) {
    throw new HttpError(503, 'Starter website template is invalid', 'STARTER_TEMPLATE_INVALID')
  }
  return { theme: theme.data, presets: presets.data }
}

function presetDocument(starter: StoredStarter, slug: string): WebsiteDocumentV1 {
  const preset = starter.presets.find((item) => item.slug === slug)
  if (!preset) {
    throw new HttpError(503, `Starter preset ${slug} is missing`, 'STARTER_TEMPLATE_INVALID')
  }
  return preset.document
}

export async function ensureStarterWebsite(input: {
  companyId: string
  companyName: string
  userId: string | null
}): Promise<{ created: boolean; pageId: string }> {
  const existing = await db('design_website_pages')
    .where({ company_id: input.companyId })
    .orderBy('created_at', 'asc')
    .first<{ id: string }>('id')
  if (existing) return { created: false, pageId: existing.id }

  const starter = await loadActiveStarter()
  const companyName = input.companyName.trim() || 'Company'

  const themeId = nanoid()
  const headerId = nanoid()
  const footerId = nanoid()
  const layoutId = nanoid()
  const pageId = nanoid()
  const now = () => db.fn.now(3)

  const header = linkHomeMenu(
    copyPresetDocument(replaceCompanyName(presetDocument(starter, 'site-header'), companyName)),
    pageId,
  )
  const footer = copyPresetDocument(replaceCompanyName(presetDocument(starter, 'site-footer'), companyName))
  const home = copyPresetDocument(replaceCompanyName(presetDocument(starter, 'welcome'), companyName))

  const presetRows = starter.presets.map((preset) => ({
    id: nanoid(),
    company_id: input.companyId,
    name: preset.name,
    document: JSON.stringify(copyPresetDocument(replaceCompanyName(preset.document, companyName))),
    is_locked: true,
    created_by: input.userId,
    created_at: now(),
    updated_at: now(),
  }))

  try {
    await db.transaction(async (trx) => {
      const raced = await trx('design_website_pages')
        .where({ company_id: input.companyId })
        .first('id')
      if (raced) return

      await trx('design_website_presets').insert(presetRows)
      await trx('design_website_themes').insert({
        id: themeId,
        company_id: input.companyId,
        name: starter.theme.name,
        page_background: starter.theme.pageBackground,
        body_text_color: starter.theme.bodyTextColor,
        is_active: true,
        is_default: true,
        is_locked: true,
        fonts: JSON.stringify(starter.theme.fonts),
        colors: JSON.stringify(starter.theme.colors),
        text_styles: JSON.stringify(starter.theme.textStyles),
        button_styles: JSON.stringify(starter.theme.buttonStyles),
        created_by: input.userId,
        created_at: now(),
        updated_at: now(),
      })
      await trx('design_website_headers').insert({
        id: headerId,
        company_id: input.companyId,
        name: 'Header',
        is_default: true,
        is_locked: true,
        document: JSON.stringify(header),
        created_by: input.userId,
        created_at: now(),
        updated_at: now(),
      })
      await trx('design_website_footers').insert({
        id: footerId,
        company_id: input.companyId,
        name: 'Footer',
        is_default: true,
        is_locked: true,
        document: JSON.stringify(footer),
        created_by: input.userId,
        created_at: now(),
        updated_at: now(),
      })
      await trx('design_website_layouts').insert({
        id: layoutId,
        company_id: input.companyId,
        name: 'Default',
        header_id: headerId,
        footer_id: footerId,
        theme_id: themeId,
        is_default: true,
        is_locked: true,
        created_by: input.userId,
        created_at: now(),
        updated_at: now(),
      })
      await trx('design_website_pages').insert({
        id: pageId,
        company_id: input.companyId,
        name: 'Home',
        path: '',
        status: 'active',
        layout_id: layoutId,
        sort_order: 0,
        document: JSON.stringify(home),
        is_locked: true,
        created_by: input.userId,
        created_at: now(),
        updated_at: now(),
      })
      await trx('design_website_datasets').insert({
        id: nanoid(),
        company_id: input.companyId,
        name: 'Products',
        source_type: 'products',
        filters: JSON.stringify({ match: 'all', rules: [] }),
        config: JSON.stringify({}),
        selected_fields: JSON.stringify(['name']),
        status: 'active',
        is_locked: true,
        created_by: input.userId,
        created_at: now(),
        updated_at: now(),
      })
      await trx('design_website_site_settings').insert({
        company_id: input.companyId,
        home_page_id: pageId,
        created_at: now(),
        updated_at: now(),
      })
    })
  } catch (err) {
    const again = await db('design_website_pages')
      .where({ company_id: input.companyId })
      .orderBy('created_at', 'asc')
      .first<{ id: string }>('id')
    if (again) return { created: false, pageId: again.id }
    throw err
  }

  const saved = await db('design_website_pages')
    .where({ company_id: input.companyId, id: pageId })
    .first('id')
  if (!saved) {
    const winner = await db('design_website_pages')
      .where({ company_id: input.companyId })
      .orderBy('created_at', 'asc')
      .first<{ id: string }>('id')
    if (winner) return { created: false, pageId: winner.id }
    throw new HttpError(500, 'Failed to create the starter website', 'STARTER_WEBSITE_FAILED')
  }
  return { created: true, pageId }
}

async function hasLockedNamed(table: string, companyId: string, name: string): Promise<boolean> {
  const row = await db(table)
    .where({ company_id: companyId })
    .where('is_locked', true)
    .whereRaw('BINARY name = ?', [name])
    .first('id')
  return Boolean(row)
}

async function lockedId(table: string, companyId: string, name?: string): Promise<string | null> {
  let query = db(table).where({ company_id: companyId }).where('is_locked', true)
  if (name) query = query.whereRaw('BINARY name = ?', [name])
  const row = await query.first<{ id: string }>('id')
  return row?.id ?? null
}

async function lockNamedRow(table: string, companyId: string, name: string): Promise<void> {
  if (await hasLockedNamed(table, companyId, name)) return
  const row = await db(table)
    .where({ company_id: companyId })
    .whereRaw('BINARY name = ?', [name])
    .first<{ id: string }>('id')
  if (!row) return
  await db(table).where({ id: row.id }).update({ is_locked: true, updated_at: db.fn.now(3) })
}

const STARTER_NAMES: Array<[string, string[]]> = [
  ['design_website_themes', ['Default']],
  ['design_website_headers', ['Header']],
  ['design_website_footers', ['Footer']],
  ['design_website_layouts', ['Default']],
  ['design_website_datasets', ['Products']],
  ['design_website_presets', ['Site header', 'Site footer', 'Welcome']],
  ['design_website_pages', ['Home']],
]

async function releaseMismatchedLocks(companyId: string): Promise<void> {
  for (const [table, names] of STARTER_NAMES) {
    const placeholders = names.map(() => '?').join(', ')
    await db(table)
      .where({ company_id: companyId })
      .where('is_locked', true)
      .whereRaw(`BINARY name NOT IN (${placeholders})`, names)
      .update({ is_locked: false, updated_at: db.fn.now(3) })
  }
}

async function defaultsComplete(companyId: string): Promise<boolean> {
  for (const [table, names] of STARTER_NAMES) {
    for (const name of names) {
      if (!(await hasLockedNamed(table, companyId, name))) return false
    }
  }
  return true
}

async function freePagePath(companyId: string): Promise<string> {
  for (const path of ['', 'home', 'home-default']) {
    const taken = await db('design_website_pages').where({ company_id: companyId, path }).first('id')
    if (!taken) return path
  }
  const suffix = nanoid(6).toLowerCase().replace(/[^a-z0-9]/g, 'a')
  return `home-${suffix}`
}

async function backfillLockedDefaults(input: {
  companyId: string
  companyName: string
  userId: string | null
}): Promise<void> {
  await lockNamedRow('design_website_themes', input.companyId, 'Default')
  await lockNamedRow('design_website_headers', input.companyId, 'Header')
  await lockNamedRow('design_website_footers', input.companyId, 'Footer')
  await lockNamedRow('design_website_layouts', input.companyId, 'Default')
  await lockNamedRow('design_website_datasets', input.companyId, 'Products')

  const home = await db('design_website_pages')
    .where({ company_id: input.companyId, path: '' })
    .whereRaw('BINARY name = ?', ['Home'])
    .first<{ id: string; is_locked: number | boolean }>('id', 'is_locked')
  if (home && home.is_locked !== true && home.is_locked !== 1 && !(await hasLockedNamed('design_website_pages', input.companyId, 'Home'))) {
    await db('design_website_pages').where({ id: home.id }).update({ is_locked: true, updated_at: db.fn.now(3) })
  }

  for (const name of ['Site header', 'Site footer', 'Welcome']) {
    await lockNamedRow('design_website_presets', input.companyId, name)
  }

  const starter = await loadActiveStarter()
  const now = () => db.fn.now(3)
  const companyName = input.companyName

  if (!(await hasLockedNamed('design_website_themes', input.companyId, 'Default'))) {
    await db('design_website_themes').insert({
      id: nanoid(),
      company_id: input.companyId,
      name: starter.theme.name,
      page_background: starter.theme.pageBackground,
      body_text_color: starter.theme.bodyTextColor,
      is_active: true,
      is_default: false,
      is_locked: true,
      fonts: JSON.stringify(starter.theme.fonts),
      colors: JSON.stringify(starter.theme.colors),
      text_styles: JSON.stringify(starter.theme.textStyles),
      button_styles: JSON.stringify(starter.theme.buttonStyles),
      created_by: input.userId,
      created_at: now(),
      updated_at: now(),
    })
  }

  const pageId = (await lockedId('design_website_pages', input.companyId, 'Home')) ?? nanoid()
  const headerDocument = linkHomeMenu(
    copyPresetDocument(replaceCompanyName(presetDocument(starter, 'site-header'), companyName)),
    pageId,
  )
  const footerDocument = copyPresetDocument(replaceCompanyName(presetDocument(starter, 'site-footer'), companyName))
  const homeDocument = copyPresetDocument(replaceCompanyName(presetDocument(starter, 'welcome'), companyName))

  if (!(await hasLockedNamed('design_website_headers', input.companyId, 'Header'))) {
    await db('design_website_headers').insert({
      id: nanoid(),
      company_id: input.companyId,
      name: 'Header',
      is_default: false,
      is_locked: true,
      document: JSON.stringify(headerDocument),
      created_by: input.userId,
      created_at: now(),
      updated_at: now(),
    })
  }
  if (!(await hasLockedNamed('design_website_footers', input.companyId, 'Footer'))) {
    await db('design_website_footers').insert({
      id: nanoid(),
      company_id: input.companyId,
      name: 'Footer',
      is_default: false,
      is_locked: true,
      document: JSON.stringify(footerDocument),
      created_by: input.userId,
      created_at: now(),
      updated_at: now(),
    })
  }
  if (!(await hasLockedNamed('design_website_layouts', input.companyId, 'Default'))) {
    await db('design_website_layouts').insert({
      id: nanoid(),
      company_id: input.companyId,
      name: 'Default',
      header_id: await lockedId('design_website_headers', input.companyId, 'Header'),
      footer_id: await lockedId('design_website_footers', input.companyId, 'Footer'),
      theme_id: await lockedId('design_website_themes', input.companyId, 'Default'),
      is_default: false,
      is_locked: true,
      created_by: input.userId,
      created_at: now(),
      updated_at: now(),
    })
  }
  if (!(await hasLockedNamed('design_website_pages', input.companyId, 'Home'))) {
    await db('design_website_pages').insert({
      id: pageId,
      company_id: input.companyId,
      name: 'Home',
      path: await freePagePath(input.companyId),
      status: 'active',
      layout_id: await lockedId('design_website_layouts', input.companyId, 'Default'),
      sort_order: 0,
      document: JSON.stringify(homeDocument),
      is_locked: true,
      created_by: input.userId,
      created_at: now(),
      updated_at: now(),
    })
  }
  for (const preset of starter.presets) {
    const locked = await hasLockedNamed('design_website_presets', input.companyId, preset.name)
    if (locked) continue
    await db('design_website_presets').insert({
      id: nanoid(),
      company_id: input.companyId,
      name: preset.name,
      document: JSON.stringify(copyPresetDocument(replaceCompanyName(preset.document, companyName))),
      is_locked: true,
      created_by: input.userId,
      created_at: now(),
      updated_at: now(),
    })
  }
  if (!(await hasLockedNamed('design_website_datasets', input.companyId, 'Products'))) {
    await db('design_website_datasets').insert({
      id: nanoid(),
      company_id: input.companyId,
      name: 'Products',
      source_type: 'products',
      filters: JSON.stringify({ match: 'all', rules: [] }),
      config: JSON.stringify({}),
      selected_fields: JSON.stringify(['name']),
      status: 'active',
      is_locked: true,
      created_by: input.userId,
      created_at: now(),
      updated_at: now(),
    })
  }
}

export async function ensureCompanyWebsiteDefaults(input: {
  companyId: string
  userId: string | null
  companyName?: string
}): Promise<void> {
  if (await defaultsComplete(input.companyId)) return
  await releaseMismatchedLocks(input.companyId)
  const companyName =
    input.companyName?.trim() ||
    (await getCompanyFromWebOnOne(input.companyId)).name.trim() ||
    'Company'
  const anyPage = await db('design_website_pages').where({ company_id: input.companyId }).first('id')
  if (!anyPage) {
    await ensureStarterWebsite({
      companyId: input.companyId,
      companyName,
      userId: input.userId,
    })
  }
  if (await defaultsComplete(input.companyId)) return
  await backfillLockedDefaults({
    companyId: input.companyId,
    companyName,
    userId: input.userId,
  })
}
