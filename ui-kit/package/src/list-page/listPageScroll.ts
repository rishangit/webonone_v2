export function getListPageScrollRoot(override?: Element | null): Element | null {
  if (override) return override
  if (typeof document === 'undefined') return null
  return document.querySelector('.platform-embed-shell-main') ?? document.getElementById('main-content')
}

export function nextVisibleCount(current: number, pageSize: number, total: number): number {
  return Math.min(total, current + pageSize)
}
