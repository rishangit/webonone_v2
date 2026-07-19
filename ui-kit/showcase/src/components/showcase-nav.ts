export type ShowcaseTab =
  | 'controls'
  | 'complex-controls'
  | 'components'
  | 'dialogs'
  | 'icons'
  | 'tags'
  | 'pages'

export type PagesNestedTab = 'list' | 'details'

export const SHOWCASE_TABS: { id: ShowcaseTab; label: string }[] = [
  { id: 'controls', label: 'Controls' },
  { id: 'complex-controls', label: 'Complex controls' },
  { id: 'components', label: 'Components' },
  { id: 'pages', label: 'Pages' },
  { id: 'dialogs', label: 'Dialogs' },
  { id: 'icons', label: 'Icons' },
  { id: 'tags', label: 'Tags' },
]

export const DEFAULT_SHOWCASE_TAB: ShowcaseTab = 'controls'

export const DEFAULT_PAGES_NESTED_TAB: PagesNestedTab = 'list'

function normalizeHash(hash: string): string {
  return hash.replace(/^#/, '').trim().toLowerCase()
}

export function parseShowcaseTab(hash: string): ShowcaseTab {
  const id = normalizeHash(hash)
  if (id === 'pages' || id.startsWith('pages-')) {
    return 'pages'
  }
  return SHOWCASE_TABS.some((t) => t.id === id) ? (id as ShowcaseTab) : DEFAULT_SHOWCASE_TAB
}

export function parsePagesNestedTab(hash: string): PagesNestedTab {
  const id = normalizeHash(hash)
  if (id === 'pages-details') {
    return 'details'
  }
  return DEFAULT_PAGES_NESTED_TAB
}

export function pagesNestedHash(nested: PagesNestedTab): string {
  return nested === 'details' ? 'pages-details' : 'pages-list'
}

/** Canonical hash for a top-level tab (Pages defaults to list). */
export function showcaseTabHash(tab: ShowcaseTab, nested: PagesNestedTab = DEFAULT_PAGES_NESTED_TAB): string {
  return tab === 'pages' ? pagesNestedHash(nested) : tab
}
