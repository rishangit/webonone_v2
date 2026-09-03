import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useUiThemeValue } from '@webonone/theme'
import { cn, shapePanelClassName, themeNeedsShapeDom, UiThemeProvider, useUiTheme } from '@webonone/ui-kit'
import { DocsSidebar } from '@/features/docs/components/DocsSidebar'
import { SupportHeader } from '@/features/docs/components/SupportHeader'
import {
  shellChromeBodyClassName,
  shellChromeRootClassName,
} from '@/features/shell/layout/shellLayout'
import { useIsMdDesktop } from '@/features/shell/hooks/useIsMdDesktop'

function SupportSidebar({
  mobileOpen,
  onNavigate,
}: {
  mobileOpen: boolean
  onNavigate: () => void
}) {
  const shapedShell = themeNeedsShapeDom(useUiTheme())

  return (
    <aside
      className={cn(
        'app-shell-sidebar shell-glass flex w-64 flex-col border-r transition-[width,transform] duration-200',
        shapedShell && shapePanelClassName,
        shapedShell && 'border-r-0',
        'max-md:app-shell-mobile-sidebar',
        mobileOpen ? 'max-md:z-40 max-md:app-shell-mobile-sidebar--open' : 'max-md:z-0',
        'md:relative md:sticky md:top-0 md:z-auto md:h-full md:max-h-full md:translate-x-0 md:self-stretch',
        mobileOpen ? 'max-md:pointer-events-auto' : 'max-md:pointer-events-none md:translate-x-0',
      )}
      aria-label="Help topics"
    >
      <DocsSidebar onNavigate={onNavigate} />
    </aside>
  )
}

function SupportLayoutContent() {
  const isDesktop = useIsMdDesktop()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()
  const showMobileNav = mobileNavOpen && !isDesktop

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), [])
  const toggleMobileNav = useCallback(() => setMobileNavOpen((open) => !open), [])

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (isDesktop) {
      setMobileNavOpen(false)
    }
  }, [isDesktop])

  useEffect(() => {
    if (!showMobileNav) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeMobileNav()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showMobileNav, closeMobileNav])

  useEffect(() => {
    document.documentElement.classList.add('app-shell-active')
    return () => document.documentElement.classList.remove('app-shell-active')
  }, [])

  return (
    <div
      className={cn(
        'app-shell-root flex h-dvh flex-col overflow-hidden bg-background text-foreground',
        shellChromeRootClassName,
      )}
    >
      <SupportHeader
        className="z-50 shrink-0"
        showMenuButton={!isDesktop}
        menuOpen={mobileNavOpen}
        onMenuClick={toggleMobileNav}
      />
      <div id="shell-overlay-root" aria-hidden />
      {showMobileNav ? (
        <button
          type="button"
          className="app-shell-mobile-nav-overlay bg-black/50"
          aria-label="Close navigation"
          onClick={closeMobileNav}
        />
      ) : null}
      <div
        className={cn(
          'app-shell-body relative flex min-h-0 flex-1',
          shellChromeBodyClassName,
          showMobileNav && 'app-shell-body--mobile-nav-open',
        )}
      >
        <SupportSidebar mobileOpen={showMobileNav} onNavigate={closeMobileNav} />
        <main
          id="main-content"
          className="relative min-h-0 min-w-0 flex-1 overflow-y-auto scrollbar-themed"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function SupportLayout() {
  const uiTheme = useUiThemeValue()

  return (
    <UiThemeProvider theme={uiTheme}>
      <SupportLayoutContent />
    </UiThemeProvider>
  )
}
