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

const COLLECTION_DISPLAY_MODE_ORDER: ListDisplayMode[] = ['list', 'grid', 'card']

/** Next layout when cycling the list-page view control (respects card/grid availability). */
export function getNextCollectionDisplayMode(
  mode: ListDisplayMode,
  cardLayout = true,
  gridLayout = true,
): ListDisplayMode {
  const effective = resolveCollectionDisplayMode(mode, cardLayout, gridLayout)
  const visibleModes = COLLECTION_DISPLAY_MODE_ORDER.filter((entry) => {
    if (!cardLayout && entry === 'card') return false
    if (!gridLayout && entry === 'grid') return false
    return true
  })
  if (visibleModes.length === 0) {
    return DEFAULT_LIST_DISPLAY_MODE
  }

  const currentIndex = Math.max(
    0,
    visibleModes.indexOf(effective),
  )
  const nextIndex = (currentIndex + 1) % visibleModes.length
  return visibleModes[nextIndex] ?? DEFAULT_LIST_DISPLAY_MODE
}
