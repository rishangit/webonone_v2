export type ListDisplayMode = 'list' | 'grid' | 'card'

export const DEFAULT_LIST_DISPLAY_MODE: ListDisplayMode = 'list'

/** Text-only collections (no row/card hero images) support list + grid only. */
export function resolveCollectionDisplayMode(
  mode: ListDisplayMode,
  cardLayout: boolean,
): ListDisplayMode {
  if (!cardLayout && mode === 'card') return 'list'
  return mode
}
