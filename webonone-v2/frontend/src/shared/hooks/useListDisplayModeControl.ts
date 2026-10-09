import { persistListDisplayMode, type ListDisplayMode } from '@webonone/theme'
import { useListDisplayMode } from '@webonone/ui-kit'
import { useAppDispatch } from '@/app/store/hooks'
import { systemThemeActions } from '@/features/settings/system-theme/store/systemThemeSlice'

export function useListDisplayModeControl() {
  const dispatch = useAppDispatch()
  const mode = useListDisplayMode()

  function setMode(next: ListDisplayMode) {
    if (next === mode) return
    persistListDisplayMode(next)
    dispatch(systemThemeActions.patchPreferencesRequested({ listDisplayMode: next }))
  }

  return { mode, setMode }
}
