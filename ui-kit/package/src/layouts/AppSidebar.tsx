import { useEffect, useState } from 'react'
import { interactiveHoverClassName } from '../lib/selectionStyles'
import { shapeCompactCardAreaClassName, shapePanelClassName } from '../lib/shape'
import { cn } from '../lib/utils'
import type { NavConfigItem } from '../types/nav'
import { useUiTheme } from '../ui-theme/UiThemeContext'
import { themeNeedsShapeDom } from '../ui-theme/uiTheme'
import { Card } from '../components/Card'
import { isStatusTagVariant, StatusTag } from '../components/StatusTag'
import { NavGroup } from '../components/nav/NavGroup'
import { NavItem } from '../components/nav/NavItem'
import { isNavPathActive } from '../components/nav/navTargetPath'
import { SidebarCollapseButton } from '../components/nav/SidebarCollapseButton'

/** Presentation-only company/context line for the sidebar footer. */
interface SidebarSession {
  title: string
  /**
   * Platform role key (`super_admin` | `company_admin` | `member` | `staff`) shown as a
   * StatusTag under the company title.
   */
  role?: string
  /**
   * Plain-text fallback when `role` is omitted. Prefer `role` for StatusTag styling.
   * @deprecated Prefer `role`
   */
  subtitle?: string
  /** Optional company/brand image URL shown in the card */
  imageUrl?: string | null
}

function SessionRoleTag({ role, subtitle }: { role?: string; subtitle?: string }) {
  if (role && isStatusTagVariant(role)) {
    return <StatusTag variant={role} className="mt-0.5 w-fit max-w-full truncate" />
  }
  if (role) {
    return (
      <StatusTag variant="member" className="mt-0.5 w-fit max-w-full truncate">
        {subtitle ?? role}
      </StatusTag>
    )
  }
  if (subtitle) {
    return (
      <p className="mt-0.5 truncate text-xs leading-snug text-muted-foreground">{subtitle}</p>
    )
  }
  return null
}

interface AppSidebarProps {
  nav: NavConfigItem[]
  activePath?: string
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  mobileOpen: boolean
  onMobileClose: () => void
  onNavItemNavigate?: (to: string) => void
  onNavItemPrefetch?: (to: string) => void
  /** When true, only one nav group can be expanded at a time. */
  accordionNavGroups?: boolean
  /**
   * Optional session/context card above the collapse control.
   * Full text card is hidden when the sidebar is collapsed; a logo-only
   * square may still show above the collapse strip when collapsed.
   * Shown in the mobile drawer when open (and not collapsed).
   */
  sidebarSession?: SidebarSession | null
  /** When set, the session card (and collapsed logo) opens account switching. */
  onSidebarSessionClick?: () => void
  /** Accessible name for the session card button (e.g. translated "Change account"). */
  sidebarSessionClickLabel?: string
  /** When true, offsets fixed/sticky sidebar below the header notice overlay. */
  hasHeaderNotice?: boolean
  className?: string
}

function sessionInitials(title: string): string {
  const parts = title.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
}

function SessionLogo({
  title,
  imageUrl,
  className,
}: {
  title: string
  imageUrl?: string | null
  className?: string
}) {
  const initials = sessionInitials(title)

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className={cn('h-9 w-9 shrink-0 rounded-md object-cover', className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground',
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  )
}

function findActiveGroupLabel(nav: NavConfigItem[], activePath: string | undefined): string | null {
  if (!activePath) return null
  for (const item of nav) {
    if (item.type === 'group' && item.children.some((child) => isNavPathActive(activePath, child.to))) {
      return item.label
    }
  }
  return null
}

function AppSidebar({
  nav,
  activePath,
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileClose,
  onNavItemNavigate,
  onNavItemPrefetch,
  accordionNavGroups = false,
  sidebarSession,
  onSidebarSessionClick,
  sidebarSessionClickLabel = 'Change account',
  hasHeaderNotice: _hasHeaderNotice = false,
  className,
}: AppSidebarProps) {
  const [expandedGroupLabel, setExpandedGroupLabel] = useState<string | null>(() =>
    accordionNavGroups ? findActiveGroupLabel(nav, activePath) : null,
  )

  useEffect(() => {
    if (!mobileOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onMobileClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen, onMobileClose])

  useEffect(() => {
    if (!accordionNavGroups) return
    const activeGroup = findActiveGroupLabel(nav, activePath)
    if (activeGroup) {
      setExpandedGroupLabel(activeGroup)
    }
  }, [accordionNavGroups, nav, activePath])

  const handleNavigate = () => {
    onMobileClose()
  }

  const showSessionCard = Boolean(sidebarSession && !collapsed)
  const showCollapsedLogo = Boolean(sidebarSession && collapsed)
  const sessionInteractive = Boolean(onSidebarSessionClick)
  const sessionCardClassName =
    'flex w-full items-center gap-2.5 px-3 py-2 shadow-none transition-colors'
  const sessionCardInteractiveClassName = cn(
    sessionCardClassName,
    'cursor-pointer hover:border-primary/50',
    interactiveHoverClassName,
  )
  const shapedShell = themeNeedsShapeDom(useUiTheme())

  return (
    <aside
      className={cn(
        'app-shell-sidebar shell-glass flex flex-col border-r transition-[width,transform] duration-200',
        shapedShell && cn(shapePanelClassName, 'border-r-0'),
        'max-md:app-shell-mobile-sidebar',
        mobileOpen ? 'max-md:z-40 max-md:app-shell-mobile-sidebar--open' : 'max-md:z-0',
        'w-64 md:relative md:sticky md:top-0 md:z-auto md:h-full md:max-h-full md:translate-x-0 md:self-stretch',
        mobileOpen ? 'max-md:pointer-events-auto' : 'max-md:pointer-events-none md:translate-x-0',
        collapsed ? 'md:w-16' : 'md:w-64',
        className,
      )}
      aria-label="Main navigation"
    >
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2 scrollbar-themed">
        {nav.map((item) => {
          if (item.type === 'group') {
            return (
              <NavGroup
                key={item.label}
                label={item.label}
                icon={item.icon}
                children={item.children}
                activePath={activePath}
                collapsed={collapsed}
                open={accordionNavGroups ? expandedGroupLabel === item.label : undefined}
                onOpenChange={
                  accordionNavGroups
                    ? (nextOpen) => setExpandedGroupLabel(nextOpen ? item.label : null)
                    : undefined
                }
                onNavItemNavigate={onNavItemNavigate}
                onNavItemPrefetch={onNavItemPrefetch}
                onNavigate={handleNavigate}
              />
            )
          }

          return (
            <NavItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              onClick={item.onClick}
              onNavItemNavigate={onNavItemNavigate}
              onNavItemPrefetch={onNavItemPrefetch}
              active={isNavPathActive(activePath, item.to)}
              collapsed={collapsed}
              onNavigate={handleNavigate}
            />
          )
        })}
      </nav>

      {showSessionCard && sidebarSession ? (
        <div className={cn('shrink-0', shapeCompactCardAreaClassName)}>
          {sessionInteractive ? (
            <button
              type="button"
              className="w-full rounded-lg text-left outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={sidebarSessionClickLabel}
              onClick={onSidebarSessionClick}
            >
              <Card compact className={sessionCardInteractiveClassName}>
                <SessionLogo title={sidebarSession.title} imageUrl={sidebarSession.imageUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-snug">{sidebarSession.title}</p>
                  <SessionRoleTag role={sidebarSession.role} subtitle={sidebarSession.subtitle} />
                </div>
              </Card>
            </button>
          ) : (
            <Card compact className={sessionCardClassName}>
              <SessionLogo title={sidebarSession.title} imageUrl={sidebarSession.imageUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-snug">{sidebarSession.title}</p>
                <SessionRoleTag role={sidebarSession.role} subtitle={sidebarSession.subtitle} />
              </div>
            </Card>
          )}
        </div>
      ) : null}

      {showCollapsedLogo && sidebarSession ? (
        <div className="hidden shrink-0 border-t p-2 md:flex md:justify-center">
          {sessionInteractive ? (
            <button
              type="button"
              className="rounded-md outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={sidebarSessionClickLabel}
              onClick={onSidebarSessionClick}
            >
              <SessionLogo title={sidebarSession.title} imageUrl={sidebarSession.imageUrl} />
            </button>
          ) : (
            <SessionLogo title={sidebarSession.title} imageUrl={sidebarSession.imageUrl} />
          )}
        </div>
      ) : null}

      <div className="hidden shrink-0 p-2 md:block">
        <SidebarCollapseButton
          collapsed={collapsed}
          onClick={() => onCollapsedChange(!collapsed)}
        />
      </div>
    </aside>
  )
}

export { AppSidebar }
export type { AppSidebarProps, SidebarSession }
