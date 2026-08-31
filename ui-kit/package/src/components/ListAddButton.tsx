import * as React from 'react'
import { Plus } from 'lucide-react'
import { cn } from '../lib/utils'
import { PageHeaderSearchContext } from '../layouts/page-header-search-context'
import { Button, type ButtonProps } from './Button'

export interface ListAddButtonProps extends Omit<ButtonProps, 'children' | 'size'> {
  children: React.ReactNode
  /** Collapsed mobile label after the Plus icon. Default: `Add`. */
  compactLabel?: React.ReactNode
  /** When set, overrides PageHeader auto-compact. Default: compact below `sm` inside PageHeader actions. */
  compactOnMobile?: boolean
}

function ListAddButton({
  children,
  compactLabel = 'Add',
  compactOnMobile,
  className,
  onClick,
  type = 'button',
  ...props
}: ListAddButtonProps) {
  const header = React.useContext(PageHeaderSearchContext)
  const compact = header !== null && (compactOnMobile ?? true)
  const expanded = header?.addExpanded ?? false
  const labelsMatch = compactLabel === children

  function handleMobileClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (!expanded && !labelsMatch) {
      event.preventDefault()
      header?.expandAdd()
      return
    }
    onClick?.(event)
    header?.collapseAdd()
  }

  const icon = <Plus className="h-4 w-4 shrink-0" aria-hidden />
  const accessibleName = typeof children === 'string' ? children : undefined
  const showFull = expanded || labelsMatch

  const addButtonClassName = cn('min-w-[7rem] sm:min-w-[8rem]', className)

  if (!compact) {
    return (
      <Button type={type} size="sm" className={addButtonClassName} onClick={onClick} {...props}>
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
        aria-expanded={labelsMatch ? undefined : expanded}
        className={cn('relative isolate justify-start overflow-hidden sm:hidden', addButtonClassName)}
        onClick={handleMobileClick}
        {...props}
      >
        {icon}
        <span
          className={cn(
            'grid transition-[grid-template-columns] duration-300 ease-out',
            showFull ? 'grid-cols-[0fr_1fr]' : 'grid-cols-[1fr_0fr]',
          )}
        >
          <span className="min-w-0 overflow-hidden">
            <span className="block whitespace-nowrap">{compactLabel}</span>
          </span>
          <span className="min-w-0 overflow-hidden">
            <span className="block whitespace-nowrap">{children}</span>
          </span>
        </span>
      </Button>
      <Button
        type={type}
        size="sm"
        className={cn('hidden sm:inline-flex', addButtonClassName)}
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
