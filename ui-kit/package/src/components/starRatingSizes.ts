export type StarRatingSize = 'sm' | 'md' | 'lg'

export const STAR_RATING_ICON_CLASSES: Record<StarRatingSize, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-7 w-7',
}

export const STAR_RATING_INPUT_BUTTON_PADDING: Record<StarRatingSize, string> = {
  sm: 'p-0.5',
  md: 'p-1',
  lg: 'p-1',
}

/**
 * Empty-star stroke. Use muted text — not `text-border`.
 * `--border` is a chrome token (website default is nearly white; WebOnOne
 * company themes overwrite it), so stars looked like two different outlines.
 */
export const STAR_RATING_OUTLINE_ICON_CLASSES = 'fill-transparent text-muted-foreground'

/** Solid filled star (input): fill + stroke are both primary — one ring */
export const STAR_RATING_FILLED_ICON_CLASSES = 'fill-primary text-primary'

/**
 * Partial-fill overlay on {@link StarRatingDisplay}. Stroke is omitted so the
 * base outline stays the only border (stacking two Lucide strokes looked like
 * a double outline).
 */
export const STAR_RATING_FILLED_OVERLAY_ICON_CLASSES = 'fill-primary stroke-none'
