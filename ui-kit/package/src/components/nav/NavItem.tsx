import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'
import { handleNavItemClick } from './handleNavItemClick'
import { isLocalNavPath } from './isLocalNavPath'

interface NavItemProps {
  to: string
  label: string
  icon: LucideIcon
  active?: boolean
  collapsed?: boolean
  nested?: boolean
  onClick?: () => void
  onNavItemNavigate?: (to: string) => void
  onNavItemPrefetch?: (to: string) => void
  onNavigate?: () => void
  className?: string
}

function NavItem({
  to,
  label,
  icon: Icon,
  active = false,
  collapsed = false,
  nested = false,
  onClick,
  onNavItemNavigate,
  onNavItemPrefetch,
  onNavigate,
  className,
}: NavItemProps) {
  const useClientNav = Boolean(onClick || (onNavItemNavigate && isLocalNavPath(to)))

  function handleMouseEnter() {
    if (!onClick && onNavItemPrefetch && isLocalNavPath(to)) {
      onNavItemPrefetch(to)
    }
  }

  return (
    <a
      href={useClientNav ? '#' : to}
      onClick={(event) =>
        handleNavItemClick(event, to, { onClick, onNavItemNavigate, onNavigate })
      }
      onMouseEnter={handleMouseEnter}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 ui-shape-control px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:py-2',
        active && 'border-l-2 border-primary bg-accent/60',
        collapsed && 'justify-center px-2',
        nested && !collapsed && 'ml-6',
        className,
      )}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </a>
  )
}

export { NavItem }
export type { NavItemProps }
