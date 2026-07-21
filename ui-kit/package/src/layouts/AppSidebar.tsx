import { useEffect, useState } from 'react'
import { cn } from '../lib/utils'
import type { NavConfigItem } from '../types/nav'
import { NavGroup } from '../components/nav/NavGroup'
import { NavItem } from '../components/nav/NavItem'
import { isNavPathActive } from '../components/nav/navTargetPath'
import { SidebarCollapseButton } from '../components/nav/SidebarCollapseButton'

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
  className?: string
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

  return (
    <aside
      className={cn(
        'glass-card fixed bottom-0 left-0 top-14 z-40 flex flex-col border-r transition-[width,transform] duration-200',
        'w-64 md:sticky md:top-14 md:z-auto md:h-[calc(100vh-3.5rem)] md:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
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
      <div className="hidden border-t p-2 md:block">
        <SidebarCollapseButton
          collapsed={collapsed}
          onClick={() => onCollapsedChange(!collapsed)}
        />
      </div>
    </aside>
  )
}

export { AppSidebar }
export type { AppSidebarProps }
