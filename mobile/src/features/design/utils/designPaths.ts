import { DESIGN_NAV_SENTINELS } from '@webonone/platform-nav'
import type { Href } from 'expo-router'

export function formsListPath(): Href {
  return DESIGN_NAV_SENTINELS.forms as Href
}

export function formEditPath(formId: string): Href {
  return `${DESIGN_NAV_SENTINELS.forms}/${formId}/edit` as Href
}

export function formFillPath(formId: string): Href {
  return `${DESIGN_NAV_SENTINELS.forms}/${formId}/fill` as Href
}

export const WEBSITE_SECTIONS = [
  'pages',
  'layouts',
  'headers',
  'footers',
  'presets',
  'datasets',
  'themes',
  'media',
  'settings',
] as const

export type WebsiteSection = (typeof WEBSITE_SECTIONS)[number]

export function websiteHubPath(section: WebsiteSection = 'pages'): Href {
  return `${DESIGN_NAV_SENTINELS.website}/${section}` as Href
}

export function websiteDesignerPath(
  kind: 'pages' | 'headers' | 'footers' | 'presets',
  id: string,
): Href {
  return `${DESIGN_NAV_SENTINELS.website}/${kind}/${id}/edit` as Href
}

export function websiteThemeEditPath(themeId: string): Href {
  return `${DESIGN_NAV_SENTINELS.website}/themes/${themeId}` as Href
}
