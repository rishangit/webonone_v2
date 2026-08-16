import {
  DEFAULT_LIST_PAGE_MODE,
  LIST_PAGE_MODE_CHANGE_EVENT,
  type ListPageMode,
} from './listPageModeConstants'

const SESSION_KEY = 'webonone:list-page-mode'

function isListPageMode(value: unknown): value is ListPageMode {
  return value === 'pagination' || value === 'on-scroll'
}

export function persistListPageMode(mode: ListPageMode): void {
  try {
    sessionStorage.setItem(SESSION_KEY, mode)
  } catch {
    // ignore quota / private mode
  }

  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(LIST_PAGE_MODE_CHANGE_EVENT, { detail: mode }))
}

export function readPersistedListPageMode(): ListPageMode | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (isListPageMode(raw)) return raw
    return null
  } catch {
    return null
  }
}

export function subscribeListPageMode(onChange: (mode: ListPageMode) => void): () => void {
  function handle(event: Event) {
    const detail = (event as CustomEvent<unknown>).detail
    if (isListPageMode(detail)) {
      onChange(detail)
    }
  }

  window.addEventListener(LIST_PAGE_MODE_CHANGE_EVENT, handle)
  return () => window.removeEventListener(LIST_PAGE_MODE_CHANGE_EVENT, handle)
}

export { DEFAULT_LIST_PAGE_MODE }
