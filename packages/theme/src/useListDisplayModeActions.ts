import { useCallback } from 'react'
import type { ListDisplayMode } from './listDisplayModeConstants'
import { persistListDisplayMode } from './listDisplayModeSession'
import { useListDisplayModeValue } from './listDisplayModeEmbed'

export function useListDisplayModeActions(options?: {
  parentOrigin?: string | null
  onPatch?: (mode: ListDisplayMode) => void
}): { mode: ListDisplayMode; setMode: (mode: ListDisplayMode) => void } {
  const mode = useListDisplayModeValue(options?.parentOrigin)

  const setMode = useCallback(
    (next: ListDisplayMode) => {
      if (next === mode) return
      persistListDisplayMode(next)
      options?.onPatch?.(next)
    },
    [mode, options?.onPatch],
  )

  return { mode, setMode }
}
