const menuPanelAnimations =
  'shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2'

/** Shared panel chrome for dropdown, select, and popover surfaces. */
export const menuPanelClassName = `glass-menu text-popover-foreground ${menuPanelAnimations}`

/** Opaque page-body wash — use for large panels (e.g. notification dropdown). */
export const menuPanelBodyClassName = `glass-card-solid text-foreground ${menuPanelAnimations}`

/** Opaque solid popover panel — no theme-tinted glass wash; follows light/dark background. */
export const popoverWhitePanelClassName = `bg-[hsl(var(--background-base))] text-foreground border border-[hsl(var(--glass-border))] shadow-md ${menuPanelAnimations}`

/** ::before caret on PopoverContent — points at the trigger (requires overflow-visible shell). */
export const popoverPointerBeforeClassName =
  'overflow-visible before:pointer-events-none before:absolute before:z-[1] before:h-2.5 before:w-2.5 before:rotate-45 before:border before:border-[hsl(var(--glass-border))] before:bg-[hsl(var(--menu-bg))] before:content-[""] data-[side=right]:before:-left-[5px] data-[side=right]:before:top-[var(--popover-pointer-y)] data-[side=right]:before:-translate-y-1/2 data-[side=right]:before:border-r-0 data-[side=right]:before:border-t-0 data-[side=left]:before:-right-[5px] data-[side=left]:before:top-[var(--popover-pointer-y)] data-[side=left]:before:-translate-y-1/2 data-[side=left]:before:border-l-0 data-[side=left]:before:border-b-0 data-[side=bottom]:before:-top-[5px] data-[side=bottom]:before:left-[var(--popover-pointer-x)] data-[side=bottom]:before:-translate-x-1/2 data-[side=bottom]:before:border-b-0 data-[side=bottom]:before:border-r-0 data-[side=top]:before:-bottom-[5px] data-[side=top]:before:left-[var(--popover-pointer-x)] data-[side=top]:before:-translate-x-1/2 data-[side=top]:before:border-t-0 data-[side=top]:before:border-l-0'

/** Side caret for popovers that only open left or right of the trigger. */
export const popoverPointerHorizontalBeforeClassName =
  'overflow-visible before:pointer-events-none before:absolute before:z-[1] before:h-2.5 before:w-2.5 before:rotate-45 before:border before:border-[hsl(var(--glass-border))] before:bg-[hsl(var(--background-base))] before:content-[""] data-[side=right]:before:-left-[5px] data-[side=right]:before:top-[var(--popover-pointer-y)] data-[side=right]:before:-translate-y-1/2 data-[side=right]:before:border-r-0 data-[side=right]:before:border-t-0 data-[side=left]:before:-right-[5px] data-[side=left]:before:top-[var(--popover-pointer-y)] data-[side=left]:before:-translate-y-1/2 data-[side=left]:before:border-l-0 data-[side=left]:before:border-b-0'
