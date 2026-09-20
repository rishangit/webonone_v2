/** Shared slide-over width — left `AppDrawer` rail and `AppStartPanel` content tree. */
export const SHELL_SIDE_PANEL_WIDTH_CLASS = 'w-80 max-w-[88%]'

/** @deprecated Use `SHELL_SIDE_PANEL_WIDTH_CLASS` — kept for right `AppEndPanel` rails. */
export const SHELL_END_PANEL_WIDTH_CLASS = SHELL_SIDE_PANEL_WIDTH_CLASS

/** Spacer below the floating header — keep panel body aligned with main content. */
export const SHELL_HEADER_SPACER_CLASS = 'h-14'

/** Same z-index as the left nav drawer overlay — below the floating header (50). */
export const SHELL_OVERLAY_LAYER_STYLE = { zIndex: 40, elevation: 40 }
