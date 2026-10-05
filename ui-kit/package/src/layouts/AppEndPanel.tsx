import { type ReactNode } from 'react'
import { Maximize2, Minimize2, X } from 'lucide-react'
import { cn } from '../lib/utils'
import {
  shellPanelBodyClassName,
  shellPanelFooterBaseClassName,
  shellPanelHeaderClassName,
  shellPanelSurfaceClassName,
  useShapedShellPanelClassName,
} from './shellPanelChrome'
import { useShellSlidePanel } from './useShellSlidePanel'
import { Button } from '../components/Button'

export interface AppEndPanelProps {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  closeLabel?: string
  className?: string
  /** Core-hosted peer panel — slide-over on all breakpoints; scrim on mobile only. */
  forceSlideOver?: boolean
  /** Span the full shell width on mobile slide-over (e.g. AI assistant chat). */
  mobileFullWidth?: boolean
  /** Desktop rail only — show expand control left of Close. */
  expandable?: boolean
  /** When true on desktop (non–slide-over), grow the rail to the left navigation. */
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  expandLabel?: string
  collapseLabel?: string
}

function AppEndPanel({
  title,
  onClose,
  children,
  footer,
  closeLabel = 'Close',
  className,
  forceSlideOver = false,
  mobileFullWidth = false,
  expandable = false,
  expanded = false,
  onExpandedChange,
  expandLabel = 'Expand',
  collapseLabel = 'Collapse',
}: AppEndPanelProps) {
  const shapedShell = useShapedShellPanelClassName()
  const { isDesktop, mobileSlidePanelClassName, renderMobilePanel } = useShellSlidePanel({
    open: true,
    onClose,
    closeLabel,
    forceSlideOver,
  })
  const slideOver = forceSlideOver || !isDesktop
  const showExpandControl = expandable && isDesktop && !slideOver
  const desktopExpanded = showExpandControl && expanded

  const panel = (
    <aside
      className={cn(
        'app-shell-end-panel flex min-h-0 flex-col overflow-hidden',
        shellPanelSurfaceClassName,
        shapedShell,
        mobileSlidePanelClassName,
        mobileFullWidth && slideOver && 'app-shell-slide-panel--full-width',
        desktopExpanded && 'app-shell-end-panel--expanded',
        !forceSlideOver && !isDesktop && shapedShell && 'border-l-0',
        !forceSlideOver &&
          isDesktop &&
          'md:static md:z-auto md:h-full md:max-h-full md:shrink-0 md:self-stretch md:border-l',
        !forceSlideOver && isDesktop && !desktopExpanded && 'md:max-w-sm',
        !forceSlideOver && isDesktop && desktopExpanded && 'md:max-w-none md:min-w-0 md:flex-1',
        !forceSlideOver && isDesktop && shapedShell && 'md:border-l-0',
        forceSlideOver && shapedShell && 'border-l-0',
        className,
      )}
      aria-label={title}
    >
      <header className={shellPanelHeaderClassName}>
        <h2 className="min-w-0 flex-1 truncate text-base font-semibold">{title}</h2>
        <div className="flex shrink-0 items-center gap-1">
          {showExpandControl ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={desktopExpanded ? collapseLabel : expandLabel}
              aria-pressed={desktopExpanded}
              onClick={() => onExpandedChange?.(!expanded)}
            >
              {desktopExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          ) : null}
          <Button type="button" variant="ghost" size="icon" aria-label={closeLabel} onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <div className={cn(shellPanelBodyClassName, forceSlideOver && 'p-0')}>{children}</div>
      {footer ? (
        <footer className={cn(shellPanelFooterBaseClassName, 'flex flex-col gap-2')}>{footer}</footer>
      ) : null}
    </aside>
  )

  return renderMobilePanel(panel)
}

export { AppEndPanel }
