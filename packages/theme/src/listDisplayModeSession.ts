import {
  DEFAULT_LIST_DISPLAY_MODE,
  LIST_DISPLAY_MODE_CHANGE_EVENT,
  LIST_DISPLAY_MODE_QUERY,
  type ListDisplayMode,
} from './listDisplayModeConstants'

const SESSION_KEY = 'webonone:list-display-mode'

function isListDisplayMode(value: unknown): value is ListDisplayMode {
  return value === 'list' || value === 'grid' || value === 'card'
}

function syncListDisplayModeQueryParam(mode: ListDisplayMode): void {
  if (typeof window === 'undefined') return

  try {
    const url = new URL(window.location.href)
    url.searchParams.set(LIST_DISPLAY_MODE_QUERY, mode)
    window.history.replaceState(window.history.state, '', url)
  } catch {
    // ignore invalid location
  }
}

export function persistListDisplayMode(mode: ListDisplayMode): void {
  try {
    sessionStorage.setItem(SESSION_KEY, mode)
  } catch {
    // ignore quota / private mode
  }

  if (typeof window === 'undefined') return
  syncListDisplayModeQueryParam(mode)
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
