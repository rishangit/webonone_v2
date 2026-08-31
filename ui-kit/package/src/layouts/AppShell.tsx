import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '../lib/utils'
import type { NavConfigItem } from '../types/nav'
import { AppHeader, type AppHeaderLocale, type AppHeaderProps, type AppHeaderUser } from '../components/AppHeader'
import { BrandLogo } from '../components/BrandLogo'
import { AppSidebar, type SidebarSession } from './AppSidebar'
import { shellChromeBodyClassName, shellChromeRootClassName } from './shellContentPadding'

const SIDEBAR_COLLAPSED_KEY = 'webonone:sidebar-collapsed'

interface AppShellProps {
  children: ReactNode
  nav: NavConfigItem[]
  activePath?: string
  logo?: ReactNode
  logoHref?: string
  user?: AppHeaderUser | null
  onProfileClick?: () => void
  onLogout?: () => void
  locale?: AppHeaderLocale
  onLocaleChange?: (locale: AppHeaderLocale) => void
  headerLabels?: AppHeaderProps['labels']
  onNavItemNavigate?: (to: string) => void
  onNavItemPrefetch?: (to: string) => void
  defaultCollapsed?: boolean
  /** When true, main does not scroll — embed content (e.g. iframe) fills main and scrolls internally. */
  embedMain?: boolean
  /**
   * When false, skips `html.app-shell-active` (document overflow lock).
   * Use for nested demos (e.g. UI Kit showcase) so the parent page can scroll.
   * @default true
   */
  lockDocumentScroll?: boolean
  /** When true, only one left-nav group can be expanded at a time. */
  accordionNavGroups?: boolean
  /**
   * Optional session/context card at the bottom of the left nav (above collapse).
   * Hidden when the sidebar is collapsed; shown in the mobile drawer when open.
   */
  sidebarSession?: SidebarSession | null
  /** When set, the sidebar session card opens account switching. */
  onSidebarSessionClick?: () => void
  /** Accessible name for the session card button (e.g. translated "Change account"). */
  sidebarSessionClickLabel?: string
  /** Optional right rail: overlays the page on small screens; in-flow beside main from md up. */
  aside?: ReactNode
  /** Optional header actions, rendered before the user avatar. */
  headerActions?: ReactNode
  /** Optional notice overlay at the top of the header. */
  headerNotice?: ReactNode
  className?: string
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    function handleChange(event: MediaQueryListEvent) {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [query])

  return matches
}

function readCollapsedPreference(defaultCollapsed: boolean): boolean {
  try {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    if (stored === 'true') return true
    if (stored === 'false') return false
  } catch {
    // ignore localStorage errors
  }
  return defaultCollapsed
}

function AppShell({
  children,
  nav,
  activePath,
  logo,
  logoHref,
  user,
  onProfileClick,
  onLogout,
  locale,
  onLocaleChange,
  headerLabels,
  onNavItemNavigate,
  onNavItemPrefetch,
  defaultCollapsed = false,
  embedMain = false,
  lockDocumentScroll = true,
  accordionNavGroups = false,
  sidebarSession,
  onSidebarSessionClick,
  sidebarSessionClickLabel,
  aside,
  headerActions,
  headerNotice,
  className,
}: AppShellProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => readCollapsedPreference(defaultCollapsed))

  useEffect(() => {
    if (isDesktop) {
      setMobileOpen(false)
    }
  }, [isDesktop])

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
    } catch {
      // ignore localStorage errors
    }
  }, [collapsed])

  useEffect(() => {
    if (!lockDocumentScroll) return
    document.documentElement.classList.add('app-shell-active')
    return () => document.documentElement.classList.remove('app-shell-active')
  }, [lockDocumentScroll])

  const logoNode = logo ?? <BrandLogo href={logoHref} />
  const hasHeaderNotice = Boolean(headerNotice)

  return (
    <div
      className={cn(
        'app-shell-root flex h-dvh flex-col overflow-hidden',
        shellChromeRootClassName,
        hasHeaderNotice && 'app-shell-root--notice',
        className,
      )}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-md"
      >
        Skip to main content
      </a>
      <AppHeader
        className="z-50 shrink-0"
        logo={logoNode}
        user={user}
        onProfileClick={onProfileClick}
        onLogout={onLogout}
        locale={locale}
        onLocaleChange={onLocaleChange}
        labels={headerLabels}
        showMenuButton={!isDesktop}
        menuOpen={mobileOpen}
        onMenuClick={() => setMobileOpen((open) => !open)}
        actions={headerActions}
        notice={headerNotice}
      />
      <div className={cn('app-shell-body relative flex min-h-0 flex-1', shellChromeBodyClassName)}>
        {mobileOpen && !isDesktop ? (
          <button
            type="button"
            className="app-shell-mobile-nav-overlay bg-black/50 md:hidden"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}
        <AppSidebar
          nav={nav}
          activePath={activePath}
          collapsed={isDesktop ? collapsed : false}
          onCollapsedChange={setCollapsed}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          onNavItemNavigate={onNavItemNavigate}
          onNavItemPrefetch={onNavItemPrefetch}
          accordionNavGroups={accordionNavGroups}
          sidebarSession={sidebarSession}
          onSidebarSessionClick={onSidebarSessionClick}
          sidebarSessionClickLabel={sidebarSessionClickLabel}
          hasHeaderNotice={hasHeaderNotice}
        />
        <main
          id="main-content"
          className={cn(
            'relative min-h-0 min-w-0 flex-1',
            embedMain ? 'overflow-hidden' : 'overflow-y-auto scrollbar-themed',
          )}
        >
          {children}
        </main>
        {aside}
      </div>
    </div>
  )
}

export { AppShell }
export type { AppShellProps }
