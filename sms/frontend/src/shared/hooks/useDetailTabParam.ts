import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

const TAB_PARAM = 'tab'

/**
 * Syncs a settings section tab with `?tab=` in the URL.
 * Default tab omits the query key; invalid values fall back to `defaultTab`.
 */
export function useDetailTabParam<T extends string>(
  allowed: readonly T[],
  defaultTab: T,
): [T, (tab: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get(TAB_PARAM)
  const tab =
    raw != null && (allowed as readonly string[]).includes(raw)
      ? (raw as T)
      : defaultTab

  const setTab = useCallback(
    (next: T) => {
      setSearchParams(
        (prev) => {
          const nextParams = new URLSearchParams(prev)
          if (next === defaultTab) {
            nextParams.delete(TAB_PARAM)
          } else {
            nextParams.set(TAB_PARAM, next)
          }
          return nextParams
        },
        { replace: false },
      )
    },
    [defaultTab, setSearchParams],
  )

  return [tab, setTab]
}
