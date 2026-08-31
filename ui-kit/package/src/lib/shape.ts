/** Card wrapper — corner accent tabs (::before top-left, ::after bottom-left). */
export const shapeCardClassName = 'ui-shape-card'

/** Clipped card surface — apply with glass-card on the inner element. */
export const shapeCardSurfaceClassName = 'ui-shape-card-surface'

/** Pad the top of a card grid / page body so ::before accent tabs are not clipped. */
export const shapeCardAreaClassName = 'ui-shape-card-area'

export const CARD_TONES = [
  'primary',
  'secondary',
  'amber',
  'teal',
  'rose',
  'violet',
  'lime',
  'sky',
] as const

export type CardTone = (typeof CARD_TONES)[number]

/** Unified card color — background + corner tabs share --card-tone. */
export function shapeCardToneClassName(tone: CardTone): string {
  return `ui-shape-card-tone-${tone}`
}

/** @deprecated Use {@link shapeCardClassName} on the outer card wrapper. */
export const shapeCardShellClassName = shapeCardClassName

/** List row wrapper — small corner accent tabs (::before top, ::after bottom). */
export const shapeListRowClassName = 'ui-shape-list-row'

/** Clipped list row surface — apply with glass-card on the inner element. */
export const shapeListRowSurfaceClassName = 'ui-shape-list-row-surface'

/** Alias for compact cards (sidebar session, etc.) — same mini accents as list rows. */
export const shapeCompactCardClassName = shapeListRowClassName

/** Inner surface for {@link shapeCompactCardClassName}. */
export const shapeCompactCardSurfaceClassName = shapeListRowSurfaceClassName

/** Pad a standalone compact card area so ::before / ::after accents are not clipped. */
export const shapeCompactCardAreaClassName = 'ui-shape-compact-card-area'

/** Top-right chamfer only — images and tags (no bottom-right inner step). */
export const shapeImageClassName = 'ui-shape-image'

/** Chamfered industrial panel (dialogs, alerts, compact panels). */
export const shapePanelClassName = 'ui-shape-panel'

/** Visible outer stroke that follows panel clip-path in high-tech. */
export const shapePanelBorderedClassName = 'ui-shape-panel-bordered'

/** Smaller chamfer for compact rows, chips, and menus. */
export const shapePanelSmClassName = 'ui-shape-panel-sm'

/** Larger chamfer + step for dialog shells. */
export const shapePanelLgClassName = 'ui-shape-panel-lg'

/** Control chamfer (buttons, inputs, selects, triggers). */
export const shapeControlClassName = 'ui-shape-control'

/** Title with a theme-accent notch. */
export const titleMarkClassName = 'ui-title'
