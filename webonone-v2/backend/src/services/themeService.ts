import { nanoid } from 'nanoid'
import { db, type SystemThemeRow } from '../models/db.js'
import type { CreateThemeBody, UpdateThemeBody } from '../schemas/themeSchemas.js'

export const PLATFORM_DEFAULT_THEME_ID = 'V7xK9mN2pQw3rTy4uIoP0'

export interface ThemeDto {
  id: string
  name: string
  color1: string
  color2: string
  color3: string
  color4: string
  color5: string
  createdBy: string
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

function rowToDto(row: SystemThemeRow): ThemeDto {
  return {
    id: row.id,
    name: row.name,
    color1: row.color1,
    color2: row.color2,
    color3: row.color3,
    color4: row.color4,
    color5: row.color5,
    createdBy: row.created_by,
    isSystem: Boolean(row.is_system),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

function visibleThemesQuery(userId: string) {
  return db<SystemThemeRow>('system_themes').where(function () {
    this.where({ is_system: true }).orWhere({ created_by: userId })
  })
}

export async function listThemes(userId: string): Promise<ThemeDto[]> {
  const rows = await visibleThemesQuery(userId).orderBy([
    { column: 'is_system', order: 'desc' },
    { column: 'name', order: 'asc' },
  ])
  return rows.map(rowToDto)
}

export async function getThemeById(id: string, userId: string): Promise<ThemeDto | null> {
  const row = await visibleThemesQuery(userId).where({ id }).first()
  return row ? rowToDto(row) : null
}

export async function getSystemDefaultTheme(): Promise<ThemeDto | null> {
  const row = await db<SystemThemeRow>('system_themes').where({ id: PLATFORM_DEFAULT_THEME_ID }).first()
  return row ? rowToDto(row) : null
}

export async function createTheme(userId: string, body: CreateThemeBody): Promise<ThemeDto> {
  const id = nanoid()
  await db('system_themes').insert({
    id,
    name: body.name,
    color1: body.color1,
    color2: body.color2,
    color3: body.color3,
    color4: body.color4,
    color5: body.color5,
    created_by: userId,
    is_system: false,
    created_at: db.fn.now(3),
    updated_at: db.fn.now(3),
  })
  const row = await db<SystemThemeRow>('system_themes').where({ id }).first()
  return rowToDto(row!)
}

type ThemeMutationResult =
  | { ok: true; theme: ThemeDto }
  | { ok: false; reason: 'not_found' | 'forbidden' }

async function getMutableThemeRow(id: string, userId: string): Promise<SystemThemeRow | null> {
  const row = await db<SystemThemeRow>('system_themes').where({ id }).first()
  if (!row) {
    return null
  }
  if (Boolean(row.is_system) || row.created_by !== userId) {
    return null
  }
  return row
}

export async function updateTheme(
  id: string,
  userId: string,
  body: UpdateThemeBody,
): Promise<ThemeMutationResult> {
  const existing = await db<SystemThemeRow>('system_themes').where({ id }).first()
  if (!existing) {
    return { ok: false, reason: 'not_found' }
  }
  if (Boolean(existing.is_system) || existing.created_by !== userId) {
    return { ok: false, reason: 'forbidden' }
  }

  const patch: Record<string, unknown> = { updated_at: db.fn.now(3) }
  if (body.name !== undefined) patch.name = body.name
  if (body.color1 !== undefined) patch.color1 = body.color1
  if (body.color2 !== undefined) patch.color2 = body.color2
  if (body.color3 !== undefined) patch.color3 = body.color3
  if (body.color4 !== undefined) patch.color4 = body.color4
  if (body.color5 !== undefined) patch.color5 = body.color5

  await db('system_themes').where({ id }).update(patch)
  const row = await db<SystemThemeRow>('system_themes').where({ id }).first()
  return { ok: true, theme: rowToDto(row!) }
}

export async function deleteTheme(
  id: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; reason: 'not_found' | 'forbidden' }> {
  const row = await getMutableThemeRow(id, userId)
  if (!row) {
    const existing = await db<SystemThemeRow>('system_themes').where({ id }).first()
    if (!existing) {
      return { ok: false, reason: 'not_found' }
    }
    return { ok: false, reason: 'forbidden' }
  }

  await db('system_themes').where({ id }).del()

  await db('user_preferences')
    .where({ active_theme_id: id })
    .update({
      active_theme_id: PLATFORM_DEFAULT_THEME_ID,
      updated_at: db.fn.now(3),
    })

  return { ok: true }
}
