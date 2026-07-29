import { useState } from 'react'
import { ChevronDown, type LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { NavItemConfig } from '../../types/nav'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../DropdownMenu'
import { handleNavItemClick } from './handleNavItemClick'
import { isLocalNavPath } from './isLocalNavPath'
import { NavItem } from './NavItem'
import { isNavPathActive } from './navTargetPath'

interface NavGroupProps {
  label: string
  icon: LucideIcon
  children: NavItemConfig[]
  activePath?: string
  collapsed?: boolean
  /** Controlled open state. When set, local toggle state is ignored. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onNavItemNavigate?: (to: string) => void
  onNavItemPrefetch?: (to: string) => void
  onNavigate?: () => void
  className?: string
}

function isChildActive(activePath: string | undefined, children: NavItemConfig[]): boolean {
  if (!activePath) return false
  const siblingTos = children.map((child) => child.to)
  return children.some((child) => isNavPathActive(activePath, child.to, siblingTos))
}

function NavGroup({
  label,
  icon: Icon,
  children,
  activePath,
  collapsed = false,
  open: openProp,
  onOpenChange,
  onNavItemNavigate,
  onNavItemPrefetch,
  onNavigate,
  className,
}: NavGroupProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(isChildActive(activePath, children))
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : uncontrolledOpen
  const groupActive = isChildActive(activePath, children)
  const siblingTos = children.map((child) => child.to)

  function handleToggle() {
    const next = !open
    if (!isControlled) {
      setUncontrolledOpen(next)
    }
    onOpenChange?.(next)
  }

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title={label}
            aria-label={label}
            className={cn(
              'flex w-full items-center justify-center rounded-md px-2 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:py-2',
              groupActive && 'border-l-2 border-primary bg-accent/60',
              className,
            )}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-48">
          {children.map((child) => {
            const useClientNav = Boolean(
              child.onClick || (onNavItemNavigate && isLocalNavPath(child.to)),
            )

            return (
              <DropdownMenuItem key={child.to} asChild>
                <a
                  href={useClientNav ? '#' : child.to}
                  onClick={(event) =>
                    handleNavItemClick(event, child.to, {
                      onClick: child.onClick,
                      onNavItemNavigate,
                      onNavigate,
                    })
                  }
                  onMouseEnter={() => {
                    if (!child.onClick && onNavItemPrefetch && isLocalNavPath(child.to)) {
                      onNavItemPrefetch(child.to)
                    }
                  }}
                  className={cn(
                    'flex cursor-pointer items-center gap-2',
                    isNavPathActive(activePath, child.to, siblingTos) && 'text-primary',
                  )}
                >
                  <child.icon className="h-4 w-4" aria-hidden />
                  {child.label}
                </a>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:py-2',
          groupActive && 'border-l-2 border-primary bg-accent/60',
        )}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden />
        <span className="flex-1 truncate text-left">{label}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="mt-1 space-y-1">
          {children.map((child) => (
            <NavItem
              key={child.to}
              to={child.to}
              label={child.label}
              icon={child.icon}
              onClick={child.onClick}
              onNavItemNavigate={onNavItemNavigate}
              onNavItemPrefetch={onNavItemPrefetch}
              nested
              active={isNavPathActive(activePath, child.to, siblingTos)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export { NavGroup }
export type { NavGroupProps }
