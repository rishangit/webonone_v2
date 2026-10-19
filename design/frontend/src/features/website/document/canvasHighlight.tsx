import { createContext, useContext, type ReactNode } from 'react'
import type { DesignerSelection } from '../types'

const CanvasHighlightContext = createContext<DesignerSelection | null>(null)

export function CanvasHighlightProvider({
  value,
  children,
}: {
  value: DesignerSelection | null
  children: ReactNode
}) {
  return <CanvasHighlightContext.Provider value={value}>{children}</CanvasHighlightContext.Provider>
}

export function useCanvasHighlight(): DesignerSelection | null {
  return useContext(CanvasHighlightContext)
}

const TreeHoverContext = createContext<((selection: DesignerSelection | null) => void) | null>(null)

export function TreeHoverProvider({
  onHover,
  children,
}: {
  onHover?: (selection: DesignerSelection | null) => void
  children: ReactNode
}) {
  return <TreeHoverContext.Provider value={onHover ?? null}>{children}</TreeHoverContext.Provider>
}

export function useTreeHoverReporter(): ((selection: DesignerSelection | null) => void) | null {
  return useContext(TreeHoverContext)
}
