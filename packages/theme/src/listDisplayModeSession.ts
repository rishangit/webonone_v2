import {
  DEFAULT_LIST_DISPLAY_MODE,
  LIST_DISPLAY_MODE_CHANGE_EVENT,
  type ListDisplayMode,
} from './listDisplayModeConstants'

const SESSION_KEY = 'webonone:list-display-mode'

function isListDisplayMode(value: unknown): value is ListDisplayMode {
  return value === 'list' || value === 'grid' || value === 'card'
}

export function persistListDisplayMode(mode: ListDisplayMode): void {
  try {
    sessionStorage.setItem(SESSION_KEY, mode)
  } catch {
    // ignore quota / private mode
  }

  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(LIST_DISPLAY_MODE_CHANGE_EVENT, { detail: mode }))
}

export function readPersistedListDisplayMode(): ListDisplayMode | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (isListDisplayMode(raw)) return raw
    return null
  } catch {
    return null
  }
}

export function subscribeListDisplayMode(onChange: (mode: ListDisplayMode) => void): () => void {
  function handle(event: Event) {
    const detail = (event as CustomEvent<unknown>).detail
    if (isListDisplayMode(detail)) {
      onChange(detail)
    }
  }

  window.addEventListener(LIST_DISPLAY_MODE_CHANGE_EVENT, handle)
  return () => window.removeEventListener(LIST_DISPLAY_MODE_CHANGE_EVENT, handle)
}

export { DEFAULT_LIST_DISPLAY_MODE }
