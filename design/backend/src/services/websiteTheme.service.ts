import { nanoid } from 'nanoid'
import { db, type DesignWebsiteThemeRow } from '../models/db.js'
import { HttpError } from './httpError.js'
import { getCompanyFromWebOnOne } from './webononeCompanyClient.js'
import type {
  CreateWebsiteThemeBody,
  UpdateWebsiteThemeBody,
  WebsiteButtonStyle,
  WebsiteColorToken,
  WebsiteFontToken,
  WebsiteTextStyle,
} from '../schemas/websiteThemes.schema.js'

export type WebsiteThemeDto = {
  id: string
  companyId: string
  name: string
  pageBackground: string
  bodyTextColor: string
  isActive: boolean
  isDefault: boolean
  fonts: WebsiteFontToken[]
  colors: WebsiteColorToken[]
  textStyles: WebsiteTextStyle[]
  buttonStyles: WebsiteButtonStyle[]
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

function parseJsonArray<T>(raw: string | unknown[]): T[] {
  if (Array.isArray(raw)) return raw as T[]
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown
      return Array.isArray(parsed) ? (parsed as T[]) : []
    } catch {
      return []
    }
  }
  return []
}

function toBool(value: number | boolean): boolean {
  return value === true || value === 1
}

function toDto(row: DesignWebsiteThemeRow): WebsiteThemeDto {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    pageBackground: row.page_background,
    bodyTextColor: row.body_text_color,
    isActive: toBool(row.is_active),
    isDefault: toBool(row.is_default),
    fonts: parseJsonArray<WebsiteFontToken>(row.fonts),
    colors: parseJsonArray<WebsiteColorToken>(row.colors),
    textStyles: parseJsonArray<WebsiteTextStyle>(row.text_styles),
    buttonStyles: parseJsonArray<WebsiteButtonStyle>(row.button_styles),
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function listWebsiteThemes(input: {
  companyId: string
  page?: number
  pageSize?: number
  q?: string
}): Promise<{ items: WebsiteThemeDto[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20))
  const offset = (page - 1) * pageSize
  let query = db<DesignWebsiteThemeRow>('design_website_themes').where({
    company_id: input.companyId,
  })
  if (input.q?.trim()) {
    const q = `%${input.q.trim().toLowerCase()}%`
    query = query.andWhere((builder) => {
      builder.whereRaw('LOWER(name) LIKE ?', [q])
    })
  }
  const countRow = await query.clone().count<{ count: number | string }[]>({ count: '*' }).first()
  const total = Number(countRow?.count ?? 0)
  const rows = await query.clone().orderBy('is_default', 'desc').orderBy('updated_at', 'desc').limit(pageSize).offset(offset)
  return { items: rows.map(toDto), total, page, pageSize }
}

export async function getWebsiteTheme(input: { companyId: string; id: string }): Promise<WebsiteThemeDto> {
  const row = await db<DesignWebsiteThemeRow>('design_website_themes')
    .where({ id: input.id, company_id: input.companyId })
    .first()
  if (!row) throw new HttpError(404, 'Theme not found', 'WEBSITE_THEME_NOT_FOUND')
  return toDto(row)
}

export async function getDefaultWebsiteTheme(input: { companyId: string }): Promise<WebsiteThemeDto | null> {
  const row =
    (await db<DesignWebsiteThemeRow>('design_website_themes')
      .where({ company_id: input.companyId, is_default: true, is_active: true })
      .first()) ??
    (await db<DesignWebsiteThemeRow>('design_website_themes')
      .where({ company_id: input.companyId, is_active: true })
      .orderBy('updated_at', 'desc')
      .first())
  return row ? toDto(row) : null
}

async function clearDefaults(companyId: string): Promise<void> {
  await db('design_website_themes').where({ company_id: companyId }).update({ is_default: false })
}

export async function createWebsiteTheme(input: {
  companyId: string
  userId: string
  body: CreateWebsiteThemeBody
}): Promise<WebsiteThemeDto> {
  await getCompanyFromWebOnOne(input.companyId)
  if (input.body.isDefault) await clearDefaults(input.companyId)
  const id = nanoid()
  await db('design_website_themes').insert({
    id,
    company_id: input.companyId,
    name: input.body.name,
    page_background: input.body.pageBackground,
    body_text_color: input.body.bodyTextColor,
    is_active: input.body.isActive,
    is_default: input.body.isDefault,
    fonts: JSON.stringify(input.body.fonts),
    colors: JSON.stringify(input.body.colors),
    text_styles: JSON.stringify(input.body.textStyles),
    button_styles: JSON.stringify(input.body.buttonStyles),
    created_by: input.userId,
    created_at: db.fn.now(3),
    updated_at: db.fn.now(3),
  })
  return getWebsiteTheme({ companyId: input.companyId, id })
}

export async function updateWebsiteTheme(input: {
  companyId: string
  id: string
  body: UpdateWebsiteThemeBody
}): Promise<WebsiteThemeDto> {
  const existing = await db<DesignWebsiteThemeRow>('design_website_themes')
    .where({ id: input.id, company_id: input.companyId })
    .first()
  if (!existing) throw new HttpError(404, 'Theme not found', 'WEBSITE_THEME_NOT_FOUND')
  if (input.body.isDefault) await clearDefaults(input.companyId)
  const updates: Record<string, unknown> = { updated_at: db.fn.now(3) }
  if (input.body.name != null) updates.name = input.body.name
  if (input.body.pageBackground != null) updates.page_background = input.body.pageBackground
  if (input.body.bodyTextColor != null) updates.body_text_color = input.body.bodyTextColor
  if (input.body.isActive != null) updates.is_active = input.body.isActive
  if (input.body.isDefault != null) updates.is_default = input.body.isDefault
  if (input.body.fonts != null) updates.fonts = JSON.stringify(input.body.fonts)
  if (input.body.colors != null) updates.colors = JSON.stringify(input.body.colors)
  if (input.body.textStyles != null) updates.text_styles = JSON.stringify(input.body.textStyles)
  if (input.body.buttonStyles != null) updates.button_styles = JSON.stringify(input.body.buttonStyles)
  await db('design_website_themes').where({ id: input.id }).update(updates)
  return getWebsiteTheme({ companyId: input.companyId, id: input.id })
}

export async function setDefaultWebsiteTheme(input: {
  companyId: string
  id: string
}): Promise<WebsiteThemeDto> {
  return updateWebsiteTheme({
    companyId: input.companyId,
    id: input.id,
    body: { isDefault: true, isActive: true },
  })
}

export async function deleteWebsiteTheme(input: { companyId: string; id: string }): Promise<void> {
  const deleted = await db('design_website_themes')
    .where({ id: input.id, company_id: input.companyId })
    .del()
  if (!deleted) throw new HttpError(404, 'Theme not found', 'WEBSITE_THEME_NOT_FOUND')
}
