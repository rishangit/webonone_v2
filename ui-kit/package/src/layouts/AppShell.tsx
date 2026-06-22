import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '../lib/utils'
import type { NavConfigItem } from '../types/nav'
import { AppHeader, type AppHeaderUser } from '../components/AppHeader'
import { BrandLogo } from '../components/BrandLogo'
import { AppSidebar } from './AppSidebar'

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
  defaultCollapsed?: boolean
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
  defaultCollapsed = false,
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

  const logoNode = logo ?? <BrandLogo href={logoHref} />

  return (
    <div className={cn('min-h-screen', className)}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-md"
      >
        Skip to main content
      </a>
      <AppHeader
        className="sticky top-0 z-50"
        logo={logoNode}
        user={user}
        onProfileClick={onProfileClick}
        onLogout={onLogout}
        showMenuButton={!isDesktop}
        menuOpen={mobileOpen}
        onMenuClick={() => setMobileOpen((open) => !open)}
      />
      <div className="flex">
        {mobileOpen && !isDesktop ? (
          <button
            type="button"
            className="fixed inset-0 top-14 z-30 bg-black/50 md:hidden"
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
        />
        <main id="main-content" className="min-h-[calc(100vh-3.5rem)] flex-1 p-6 scrollbar-themed">
          {children}
        </main>
      </div>
    </div>
  )
}

export { AppShell }
export type { AppShellProps }
