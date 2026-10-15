export type ListDisplayMode = 'list' | 'grid' | 'card'

export const DEFAULT_LIST_DISPLAY_MODE: ListDisplayMode = 'list'

/**
 * Text-only collections (`cardLayout` false) support list + grid.
 * Media pickers (`gridLayout` false) support list + card.
 * A hidden mode falls back to list.
 */
export function resolveCollectionDisplayMode(
  mode: ListDisplayMode,
  cardLayout: boolean,
  gridLayout = true,
): ListDisplayMode {
  if (!gridLayout && mode === 'grid') return 'list'
  if (!cardLayout && mode === 'card') return 'list'
  return mode
}
