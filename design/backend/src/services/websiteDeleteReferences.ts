import { db } from '../models/db.js'

const DOCUMENT_TABLES = [
  'design_website_pages',
  'design_website_headers',
  'design_website_footers',
  'design_website_presets',
] as const

export function documentReferencesId(value: unknown, key: string, id: string): boolean {
  if (Array.isArray(value)) return value.some((item) => documentReferencesId(item, key, id))
  if (!value || typeof value !== 'object') return false
  for (const [childKey, child] of Object.entries(value as Record<string, unknown>)) {
    if (childKey === key && child === id) return true
    if (documentReferencesId(child, key, id)) return true
  }
  return false
}

export async function pageHasReferences(companyId: string, pageId: string): Promise<boolean> {
  const home = await db('design_website_site_settings')
    .where({ company_id: companyId, home_page_id: pageId })
    .first('company_id')
  if (home) return true
  return documentsReference(companyId, 'linkPageId', pageId, { table: 'design_website_pages', id: pageId })
}

export async function presetHasReferences(companyId: string, presetId: string): Promise<boolean> {
  return documentsReference(companyId, 'sourcePresetId', presetId, { table: 'design_website_presets', id: presetId })
}

async function documentsReference(
  companyId: string,
  key: string,
  id: string,
  except: { table: string; id: string },
): Promise<boolean> {
  for (const table of DOCUMENT_TABLES) {
    let query = db(table).where({ company_id: companyId }).select('id', 'document')
    if (table === except.table) query = query.whereNot({ id: except.id })
    const rows = await query
    for (const row of rows) {
      if (documentReferencesId(parseDocument(row.document), key, id)) return true
    }
  }
  return false
}

function parseDocument(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}
