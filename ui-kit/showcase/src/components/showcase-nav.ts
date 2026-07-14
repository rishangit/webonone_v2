export type ShowcaseTab = 'controls' | 'components' | 'dialogs' | 'icons' | 'tags' | 'pages'

export type PagesNestedTab = 'list' | 'details'

export const SHOWCASE_TABS: { id: ShowcaseTab; label: string }[] = [
  { id: 'controls', label: 'Controls' },
  { id: 'components', label: 'Components' },
  { id: 'pages', label: 'Pages' },
  { id: 'dialogs', label: 'Dialogs' },
  { id: 'icons', label: 'Icons' },
  { id: 'tags', label: 'Tags' },
]

export const DEFAULT_SHOWCASE_TAB: ShowcaseTab = 'controls'

export const DEFAULT_PAGES_NESTED_TAB: PagesNestedTab = 'list'

export function parseShowcaseTab(hash: string): ShowcaseTab {
  const id = hash.replace(/^#/, '')
  if (id === 'pages' || id.startsWith('pages-')) return 'pages'
  return SHOWCASE_TABS.some((t) => t.id === id) ? (id as ShowcaseTab) : DEFAULT_SHOWCASE_TAB
}

export function parsePagesNestedTab(hash: string): PagesNestedTab {
  const id = hash.replace(/^#/, '')
  if (id === 'pages-details') return 'details'
  return DEFAULT_PAGES_NESTED_TAB
}

export function pagesNestedHash(nested: PagesNestedTab): string {
  return nested === 'details' ? 'pages-details' : 'pages-list'
}
