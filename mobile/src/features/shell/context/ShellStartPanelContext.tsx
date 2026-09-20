import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { AppStartPanel, type AppStartPanelProps } from '@webonone/mobile-ui'

export type ShellStartPanelState = Omit<AppStartPanelProps, 'shell'>

type ShellStartPanelContextValue = {
  panel: ShellStartPanelState | null
  setPanel: Dispatch<SetStateAction<ShellStartPanelState | null>>
}

const ShellStartPanelContext = createContext<ShellStartPanelContextValue | null>(null)

export function ShellStartPanelProvider({ children }: { children: ReactNode }) {
  const [panel, setPanel] = useState<ShellStartPanelState | null>(null)
  const value = useMemo(() => ({ panel, setPanel }), [panel])
  return <ShellStartPanelContext.Provider value={value}>{children}</ShellStartPanelContext.Provider>
}

export function ShellStartPanelOutlet() {
  const ctx = useContext(ShellStartPanelContext)
  if (!ctx?.panel?.open) return null
  return <AppStartPanel {...ctx.panel} shell />
}

export function useShellStartPanelContext() {
  const ctx = useContext(ShellStartPanelContext)
  if (!ctx) {
    throw new Error('useShellStartPanelContext must be used within ShellStartPanelProvider')
  }
  return ctx
}
