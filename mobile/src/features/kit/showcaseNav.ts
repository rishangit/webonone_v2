export type ShowcaseTab =
  | 'controls'
  | 'complex-controls'
  | 'components'
  | 'pages'
  | 'dialogs'
  | 'icons'
  | 'tags'

export const SHOWCASE_TABS: { id: ShowcaseTab; label: string }[] = [
  { id: 'controls', label: 'Controls' },
  { id: 'complex-controls', label: 'Complex' },
  { id: 'components', label: 'Components' },
  { id: 'pages', label: 'Pages' },
  { id: 'dialogs', label: 'Dialogs' },
  { id: 'icons', label: 'Icons' },
  { id: 'tags', label: 'Tags' },
]
