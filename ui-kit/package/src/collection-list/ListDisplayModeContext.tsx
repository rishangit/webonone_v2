import { createContext, useContext, type ReactNode } from 'react'
import { DEFAULT_LIST_DISPLAY_MODE, type ListDisplayMode } from './listDisplayMode'

const ListDisplayModeContext = createContext<ListDisplayMode>(DEFAULT_LIST_DISPLAY_MODE)

export function ListDisplayModeProvider({
  mode = DEFAULT_LIST_DISPLAY_MODE,
  children,
}: {
  mode?: ListDisplayMode
  children: ReactNode
}) {
  return <ListDisplayModeContext.Provider value={mode}>{children}</ListDisplayModeContext.Provider>
}

export function useListDisplayMode(): ListDisplayMode {
  return useContext(ListDisplayModeContext)
}
