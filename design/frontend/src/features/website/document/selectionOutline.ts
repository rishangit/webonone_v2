/** Content element (block) uses theme primary (color1). Addon uses theme accent (color3).
 * Use box-shadow rings — CSS outline does not follow the scaled designer canvas. */
export const CONTENT_ELEMENT_OUTLINE = 'ring-2 ring-inset ring-primary'
export const CONTENT_ELEMENT_PARENT_OUTLINE = 'ring-2 ring-inset ring-primary/50'
export const ADDON_OUTLINE = 'ring-2 ring-inset ring-[hsl(var(--accent-secondary))]'
export const CONTENT_ELEMENT_FRAME = 'pointer-events-none absolute inset-0 z-20 border-2 border-primary'
export const CONTENT_ELEMENT_PARENT_FRAME =
  'pointer-events-none absolute inset-0 z-20 border-2 border-dashed border-primary'
export const ADDON_FRAME =
  'pointer-events-none absolute inset-0 z-20 border-2 border-[hsl(var(--accent-secondary))]'
/**
 * Container edge must sit above absolutely positioned blocks (selected z ≥ 10000).
 * Inset rings on the container paint under children and disappear when content is flush to the edge.
 */
export const CONTENT_CONTAINER_EDGE =
  'pointer-events-none absolute inset-0 z-[20000] border border-[hsl(var(--glass-border))]'
export const CONTENT_CONTAINER_FRAME =
  'pointer-events-none absolute inset-0 z-[20001] border-2 border-primary'
