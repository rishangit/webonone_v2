import { db, type UiThemeId, type UserPreferenceRow } from '../models/db.js'
import type { PatchPreferencesBody } from '../schemas/themeSchemas.js'
import * as themeService from './themeService.js'

const KNOWN_UI_THEMES = new Set<UiThemeId>(['classic', 'high-tech'])

function normalizeUiTheme(value: string | null | undefined): UiThemeId {
  if (value && KNOWN_UI_THEMES.has(value as UiThemeId)) {
    return value as UiThemeId
  }
  return 'classic'
}

export interface PreferencesDto {
  activeThemeId: string
  colorMode: 'light' | 'dark'
  listPageMode: 'pagination' | 'on-scroll'
  uiTheme: UiThemeId
  theme: themeService.ThemeDto
}

async function ensurePreferencesRow(userId: string): Promise<UserPreferenceRow> {
  const existing = await db<UserPreferenceRow>('user_preferences').where({ user_id: userId }).first()
  if (existing) {
    return existing
  }

  await db('user_preferences').insert({
    user_id: userId,
    active_theme_id: themeService.PLATFORM_DEFAULT_THEME_ID,
    color_mode: 'light',
    list_page_mode: 'pagination',
    ui_theme: 'classic',
    updated_at: db.fn.now(3),
  })

  const row = await db<UserPreferenceRow>('user_preferences').where({ user_id: userId }).first()
  return row!
}

async function resolveActiveTheme(
  userId: string,
  activeThemeId: string,
): Promise<themeService.ThemeDto> {
  const theme = await themeService.getThemeById(activeThemeId, userId)
  if (theme) {
    return theme
  }

  const fallback = await themeService.getSystemDefaultTheme()
  if (!fallback) {
    throw new Error('Platform default theme is missing')
  }

  await db('user_preferences').where({ user_id: userId }).update({
    active_theme_id: themeService.PLATFORM_DEFAULT_THEME_ID,
    updated_at: db.fn.now(3),
  })

  return fallback
}

export async function getPreferences(userId: string): Promise<PreferencesDto> {
  const pref = await ensurePreferencesRow(userId)
  const theme = await resolveActiveTheme(userId, pref.active_theme_id)

  return {
    activeThemeId: theme.id,
    colorMode: pref.color_mode,
    listPageMode: pref.list_page_mode ?? 'pagination',
    uiTheme: normalizeUiTheme(pref.ui_theme),
    theme,
  }
}

type PatchPreferencesResult =
  | { ok: true; preferences: PreferencesDto }
  | { ok: false; reason: 'invalid_theme' }

export async function patchPreferences(
  userId: string,
  body: PatchPreferencesBody,
): Promise<PatchPreferencesResult> {
  if (body.activeThemeId !== undefined) {
    const theme = await themeService.getThemeById(body.activeThemeId, userId)
    if (!theme) {
      return { ok: false, reason: 'invalid_theme' }
    }
  }

  await ensurePreferencesRow(userId)

  const patch: Record<string, unknown> = { updated_at: db.fn.now(3) }
  if (body.activeThemeId !== undefined) {
    patch.active_theme_id = body.activeThemeId
  }
  if (body.colorMode !== undefined) {
    patch.color_mode = body.colorMode
  }
  if (body.listPageMode !== undefined) {
    patch.list_page_mode = body.listPageMode
  }
  if (body.uiTheme !== undefined) {
    patch.ui_theme = body.uiTheme
  }

  await db('user_preferences').where({ user_id: userId }).update(patch)

  const preferences = await getPreferences(userId)
  return { ok: true, preferences }
}
