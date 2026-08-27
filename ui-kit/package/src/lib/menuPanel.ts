const menuPanelAnimations =
  'shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2'

/** Shared panel chrome for dropdown, select, and popover surfaces. */
export const menuPanelClassName = `glass-menu text-popover-foreground ${menuPanelAnimations}`

/** Opaque page-body wash — use for large panels (e.g. notification dropdown). */
export const menuPanelBodyClassName = `glass-card-solid text-foreground ${menuPanelAnimations}`
