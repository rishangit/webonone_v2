import { cn } from './utils'

/** Selected nav item / tab surface — theme primary accent tint. */
export const selectedSurfaceClassName = 'bg-[var(--color-selection)] text-primary'

/** Sidebar nav active indicator (left rail). */
export const navItemActiveClassName = `border-l-2 border-primary ${selectedSurfaceClassName}`

/**
 * Shared interactive hover — selection tint + primary text.
 * Use on nav, tabs, ghost buttons, cards, menus, and list options.
 */
export const interactiveHoverClassName =
  'hover:bg-[var(--color-selection)] hover:text-primary'

/** Radix focus / highlight / open states — same colors as hover. */
export const interactiveHighlightClassName =
  'focus:bg-[var(--color-selection)] focus:text-primary data-[highlighted]:bg-[var(--color-selection)] data-[highlighted]:text-primary data-[state=open]:bg-[var(--color-selection)] data-[state=open]:text-primary'

/** Icon-only controls — primary text on hover, no fill. */
export const interactiveHoverTextClassName = 'hover:text-primary'

/** Active row in custom listboxes (CountrySelect, PhoneCountrySelect, etc.). */
export const interactiveHighlightSurfaceClassName = 'bg-[var(--color-selection)] text-primary'

/** Tab trigger inactive — opaque shell chrome; hover matches nav. */
export const tabTriggerInactiveClassName = cn(
  'bg-[hsl(var(--shell-chrome-bg))] text-label data-[state=inactive]:bg-[hsl(var(--shell-chrome-bg))] data-[state=inactive]:text-label',
  interactiveHoverClassName,
)

/** Tab trigger active state — z-index only; backgrounds handled in globals.css. */
export const tabTriggerActiveClassName =
  'data-[state=active]:z-10 data-[state=active]:bg-[var(--color-selection)] data-[state=active]:text-primary data-[state=active]:shadow-none'

/** @deprecated Alias for {@link tabTriggerActiveClassName}. Folder tabs use {@link tabTriggerActiveClassicClassName}. */
export const tabTriggerActiveClassicClassName = 'data-[state=active]:z-20'
