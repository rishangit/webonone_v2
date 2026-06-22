import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

interface NavItemProps {
  to: string
  label: string
  icon: LucideIcon
  active?: boolean
  collapsed?: boolean
  nested?: boolean
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
  onNavigate,
  className,
}: NavItemProps) {
  return (
    <a
      href={to}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
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
