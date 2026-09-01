import { useEffect, useState, type ReactNode } from 'react'

import { cn } from '../lib/utils'

import { useMediaQuery } from '../hooks/useMediaQuery'

import type { NavConfigItem } from '../types/nav'

import { AppHeader, type AppHeaderLocale, type AppHeaderProps, type AppHeaderUser } from '../components/AppHeader'

import { BrandLogo } from '../components/BrandLogo'

import { AppSidebar, type SidebarSession } from './AppSidebar'

import { ShellOverlayProvider, useShellOverlay, useShellOverlayActive } from './ShellOverlayProvider'

import { shellChromeBodyClassName, shellChromeRootClassName } from './shellContentPadding'

import { shellSlideHostClassName } from './shellPanelChrome'

import { SHELL_OVERLAY_ROOT_ID, SHELL_SLIDE_HOST_ID } from './shellOverlay'



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



interface AppShellChromeProps extends AppShellProps {

  isDesktop: boolean

  mobileOpen: boolean

  setMobileOpen: (open: boolean | ((prev: boolean) => boolean)) => void

  collapsed: boolean

  setCollapsed: (collapsed: boolean) => void

}



function AppShellChrome({

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

  embedMain = false,

  accordionNavGroups = false,

  sidebarSession,

  onSidebarSessionClick,

  sidebarSessionClickLabel,

  aside,

  headerActions,

  headerNotice,

  isDesktop,

  mobileOpen,

  setMobileOpen,

  collapsed,

  setCollapsed,

}: AppShellChromeProps) {

  const logoNode = logo ?? <BrandLogo href={logoHref} />

  const hasHeaderNotice = Boolean(headerNotice)

  const overlayOpen = useShellOverlayActive()

  useShellOverlay({

    id: 'mobile-nav',

    open: mobileOpen && !isDesktop,

    onClose: () => setMobileOpen(false),

    ariaLabel: 'Close navigation',

  })



  return (

    <>

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

      <div id={SHELL_OVERLAY_ROOT_ID} aria-hidden />

      <div

        className={cn(

          'app-shell-body relative flex min-h-0 flex-1',

          shellChromeBodyClassName,

          overlayOpen && 'app-shell-body--overlay-open',

          mobileOpen && !isDesktop && 'app-shell-body--mobile-nav-open',

        )}

      >

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

        <div id={SHELL_SLIDE_HOST_ID} className={shellSlideHostClassName} aria-hidden />

        {aside}

      </div>

    </>

  )

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

      <ShellOverlayProvider>

        <AppShellChrome

          nav={nav}

          activePath={activePath}

          logo={logo}

          logoHref={logoHref}

          user={user}

          onProfileClick={onProfileClick}

          onLogout={onLogout}

          locale={locale}

          onLocaleChange={onLocaleChange}

          headerLabels={headerLabels}

          onNavItemNavigate={onNavItemNavigate}

          onNavItemPrefetch={onNavItemPrefetch}

          embedMain={embedMain}

          accordionNavGroups={accordionNavGroups}

          sidebarSession={sidebarSession}

          onSidebarSessionClick={onSidebarSessionClick}

          sidebarSessionClickLabel={sidebarSessionClickLabel}

          aside={aside}

          headerActions={headerActions}

          headerNotice={headerNotice}

          className={className}

          isDesktop={isDesktop}

          mobileOpen={mobileOpen}

          setMobileOpen={setMobileOpen}

          collapsed={collapsed}

          setCollapsed={setCollapsed}

        >

          {children}

        </AppShellChrome>

      </ShellOverlayProvider>

    </div>

  )

}



export { AppShell }

export type { AppShellProps }


