import { createContext, useContext, type ReactNode } from 'react'
import { DEFAULT_LIST_PAGE_MODE, type ListPageMode } from './listPageMode'

const ListPageModeContext = createContext<ListPageMode>(DEFAULT_LIST_PAGE_MODE)

export function ListPageModeProvider({
  mode = DEFAULT_LIST_PAGE_MODE,
  children,
}: {
  mode?: ListPageMode
  children: ReactNode
}) {
  return <ListPageModeContext.Provider value={mode}>{children}</ListPageModeContext.Provider>
}

export function useListPageMode(): ListPageMode {
  return useContext(ListPageModeContext)
}
