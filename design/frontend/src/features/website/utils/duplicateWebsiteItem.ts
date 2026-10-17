export function duplicateItemName(name: string): string {
  const trimmed = name.trim() || 'Item'
  const next = `${trimmed} copy`
  return next.length > 255 ? `${trimmed.slice(0, 248).trimEnd()} copy` : next
}

export function duplicatePagePath(path: string): string {
  const base = (path || 'home').toLowerCase().replace(/[^a-z0-9/-]/g, '').slice(0, 100) || 'home'
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}-copy-${suffix}`.slice(0, 128)
}
