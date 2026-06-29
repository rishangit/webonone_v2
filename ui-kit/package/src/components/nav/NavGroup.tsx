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
import { NavItem } from './NavItem'
import { isNavPathActive } from './navTargetPath'

interface NavGroupProps {
  label: string
  icon: LucideIcon
  children: NavItemConfig[]
  activePath?: string
  collapsed?: boolean
  onNavigate?: () => void
  className?: string
}

function isChildActive(activePath: string | undefined, children: NavItemConfig[]): boolean {
  if (!activePath) return false
  return children.some((child) => isNavPathActive(activePath, child.to))
}

function NavGroup({
  label,
  icon: Icon,
  children,
  activePath,
  collapsed = false,
  onNavigate,
  className,
}: NavGroupProps) {
  const [open, setOpen] = useState(isChildActive(activePath, children))
  const groupActive = isChildActive(activePath, children)

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title={label}
            aria-label={label}
            className={cn(
              'flex w-full items-center justify-center rounded-md px-2 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
              groupActive && 'border-l-2 border-primary bg-accent/60',
              className,
            )}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-48">
          {children.map((child) => (
            <DropdownMenuItem key={child.to} asChild>
              <a
                href={child.onClick ? '#' : child.to}
                onClick={(event) => {
                  if (child.onClick) {
                    event.preventDefault()
                    child.onClick()
                  }
                  onNavigate?.()
                }}
                className={cn(
                  'flex cursor-pointer items-center gap-2',
                  isNavPathActive(activePath, child.to) && 'text-primary',
                )}
              >
                <child.icon className="h-4 w-4" aria-hidden />
                {child.label}
              </a>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
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
              nested
              active={isNavPathActive(activePath, child.to)}
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
