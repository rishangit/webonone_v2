import { shapePanelClassName } from '../lib/shape'
import { useUiTheme } from '../ui-theme/UiThemeContext'
import { themeNeedsShapeDom } from '../ui-theme/uiTheme'

/** Opaque shell chrome surface — matches AppSidebar / AppHeader. */
const shellPanelSurfaceClassName = 'shell-glass'

const shellPanelHeaderClassName =
  'flex shrink-0 items-center justify-between border-b border-[hsl(var(--shell-chrome-border))] px-4 py-3'

const shellPanelBodyClassName =
  'flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 scrollbar-themed'

const shellPanelFooterBaseClassName =
  'shrink-0 border-t border-[hsl(var(--shell-chrome-border))] p-4'

/** Shared full-viewport scrim — rendered once by ShellOverlayProvider. */
const shellPanelScrimClassName = 'app-shell-mobile-nav-overlay bg-black/50'

/** Right rail slide-over — mirrors mobile left nav top, height, and width. */
const shellSlidePanelClassName = 'app-shell-slide-panel'

/** Anchored inside `.app-shell-body` / `#shell-slide-host` (not viewport-fixed). */
const shellSlidePanelAnchoredClassName = 'app-shell-slide-panel--anchored'

/** Slide panel mount — absolute layer over the shell body row on mobile. */
const shellSlideHostClassName = 'app-shell-slide-host md:contents'

function useShapedShellPanelClassName(): typeof shapePanelClassName | false {
  return themeNeedsShapeDom(useUiTheme()) ? shapePanelClassName : false
}

export {
  shellPanelSurfaceClassName,
  shellPanelHeaderClassName,
  shellPanelBodyClassName,
  shellPanelFooterBaseClassName,
  shellPanelScrimClassName,
  shellSlidePanelClassName,
  shellSlidePanelAnchoredClassName,
  shellSlideHostClassName,
  useShapedShellPanelClassName,
}
