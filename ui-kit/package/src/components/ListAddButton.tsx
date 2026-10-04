import * as React from 'react'
import { Plus } from 'lucide-react'
import { cn } from '../lib/utils'
import { PageHeaderSearchContext } from '../layouts/page-header-search-context'
import { Button, type ButtonProps } from './Button'

export interface ListAddButtonProps extends Omit<ButtonProps, 'children' | 'size'> {
  children: React.ReactNode
  /**
   * @deprecated Collapsed mobile state is icon-only; this prop is ignored for display.
   * Kept for call-site compatibility.
   */
  compactLabel?: React.ReactNode
  /** When set, overrides PageHeader auto-compact. Default: compact below `sm` inside PageHeader actions. */
  compactOnMobile?: boolean
}

function ListAddButton({
  children,
  compactLabel: _compactLabel,
  compactOnMobile,
  className,
  onClick,
  type = 'button',
  ...props
}: ListAddButtonProps) {
  const header = React.useContext(PageHeaderSearchContext)
  const compact = header !== null && (compactOnMobile ?? true)
  const expanded = header?.addExpanded ?? false

  function handleMobileClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (!expanded) {
      event.preventDefault()
      header?.expandAdd()
      return
    }
    onClick?.(event)
    header?.collapseAdd()
  }

  const icon = <Plus className="h-4 w-4 shrink-0" aria-hidden />
  const accessibleName = typeof children === 'string' ? children : undefined

  if (!compact) {
    return (
      <Button type={type} size="sm" className={className} onClick={onClick} {...props}>
        {icon}
        {children}
      </Button>
    )
  }

  return (
    <>
      <Button
        type={type}
        size="sm"
        data-list-add-button=""
        aria-label={accessibleName}
        aria-expanded={expanded}
        className={cn(
          'relative isolate justify-center overflow-hidden sm:hidden',
          expanded ? 'gap-2 justify-start has-[svg]:px-5' : 'h-9 w-9 shrink-0 gap-0 px-0 has-[svg]:px-0',
          className,
        )}
        onClick={handleMobileClick}
        {...props}
      >
        {icon}
        <span
          className={cn(
            'grid transition-[grid-template-columns] duration-300 ease-out',
            expanded ? 'grid-cols-[1fr]' : 'grid-cols-[0fr]',
          )}
        >
          <span className="min-w-0 overflow-hidden">
            <span className="block whitespace-nowrap">{children}</span>
          </span>
        </span>
      </Button>
      <Button
        type={type}
        size="sm"
        className={cn('hidden sm:inline-flex', className)}
        onClick={onClick}
        {...props}
      >
        {icon}
        {children}
      </Button>
    </>
  )
}

export { ListAddButton }
