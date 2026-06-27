export type ShowcaseTab = 'controls' | 'components' | 'dialogs' | 'icons' | 'tags'

export const SHOWCASE_TABS: { id: ShowcaseTab; label: string }[] = [
  { id: 'controls', label: 'Controls' },
  { id: 'components', label: 'Components' },
  { id: 'dialogs', label: 'Dialogs' },
  { id: 'icons', label: 'Icons' },
  { id: 'tags', label: 'Tags' },
]

export const DEFAULT_SHOWCASE_TAB: ShowcaseTab = 'controls'

export function parseShowcaseTab(hash: string): ShowcaseTab {
  const id = hash.replace(/^#/, '') as ShowcaseTab
  return SHOWCASE_TABS.some((t) => t.id === id) ? id : DEFAULT_SHOWCASE_TAB
}
