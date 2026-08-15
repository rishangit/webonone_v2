import { createContext } from 'react'

export interface PageHeaderSearchController {
  expanded: boolean
  revealed: boolean
  overlayEl: HTMLDivElement | null
  open: () => void
  close: () => void
  addExpanded: boolean
  expandAdd: () => void
  collapseAdd: () => void
}

/** Set when SearchInput / ListAddButton are rendered inside PageHeader actions (compact on small screens). */
export const PageHeaderSearchContext = createContext<PageHeaderSearchController | null>(null)
