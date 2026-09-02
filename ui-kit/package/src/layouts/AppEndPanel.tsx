import { type ReactNode } from 'react'
import { X } from 'lucide-react'
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
  /** Core-hosted peer panel — slide-over on all breakpoints. */
  forceSlideOver?: boolean
  /** Span the full shell width on mobile slide-over (e.g. AI assistant chat). */
  mobileFullWidth?: boolean
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
}: AppEndPanelProps) {
  const shapedShell = useShapedShellPanelClassName()
  const { isDesktop, mobileSlidePanelClassName, renderMobilePanel } = useShellSlidePanel({
    open: true,
    onClose,
    closeLabel,
    forceSlideOver,
  })
  const slideOver = forceSlideOver || !isDesktop

  const panel = (
    <aside
      className={cn(
        'app-shell-end-panel flex min-h-0 flex-col overflow-hidden',
        shellPanelSurfaceClassName,
        shapedShell,
        mobileSlidePanelClassName,
        mobileFullWidth && slideOver && 'app-shell-slide-panel--full-width',
        !forceSlideOver && !isDesktop && shapedShell && 'border-l-0',
        !forceSlideOver &&
          isDesktop &&
          'md:static md:z-auto md:h-full md:max-h-full md:max-w-sm md:shrink-0 md:self-stretch md:border-l',
        !forceSlideOver && isDesktop && shapedShell && 'md:border-l-0',
        forceSlideOver && shapedShell && 'border-l-0',
        className,
      )}
      aria-label={title}
    >
      <header className={shellPanelHeaderClassName}>
        <h2 className="text-base font-semibold">{title}</h2>
        <Button type="button" variant="ghost" size="icon" aria-label={closeLabel} onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
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
