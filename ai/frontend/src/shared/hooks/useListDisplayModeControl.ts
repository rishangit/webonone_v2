import { persistListDisplayMode, type ListDisplayMode } from '@webonone/theme'
import { useListDisplayMode } from '@webonone/ui-kit'

export function useListDisplayModeControl() {
  const mode = useListDisplayMode()

  function setMode(next: ListDisplayMode) {
    if (next === mode) return
    persistListDisplayMode(next)
  }

  return { mode, setMode }
}
