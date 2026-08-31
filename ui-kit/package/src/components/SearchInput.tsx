import * as React from 'react'
import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'
import { interactiveHoverTextClassName } from '../lib/selectionStyles'
import { cn } from '../lib/utils'
import { PageHeaderSearchContext } from '../layouts/page-header-search-context'
import { Button } from './Button'
import { Input, type InputProps } from './Input'
import { InputGroup, InputGroupIcon } from './InputGroup'

export interface SearchInputProps extends Omit<InputProps, 'type'> {
  onClear?: () => void
  /** When set, overrides PageHeader auto-compact. Default: compact below `sm` inside PageHeader actions. */
  compactOnMobile?: boolean
}

type SearchInputFieldProps = Omit<SearchInputProps, 'compactOnMobile'>

const SearchInputField = React.forwardRef<HTMLInputElement, SearchInputFieldProps>(
  ({ className, value, onChange, onClear, disabled, ...props }, ref) => {
    const hasValue = typeof value === 'string' ? value.length > 0 : Boolean(value)

    function handleClear() {
      if (disabled) return
      onChange?.({
        target: { value: '' },
        currentTarget: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>)
      onClear?.()
    }

    return (
      <InputGroup
        className={cn(className)}
        invalid={props['aria-invalid'] === true || props['aria-invalid'] === 'true'}
      >
        <InputGroupIcon icon={Search} />
        <Input
          ref={ref}
          inGroup
          type="text"
          role="searchbox"
          value={value}
          onChange={onChange}
          disabled={disabled}
          {...props}
        />
        {hasValue ? (
          <button
            type="button"
            className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-transparent text-muted-foreground transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50', interactiveHoverTextClassName)}
            onClick={handleClear}
            aria-label="Clear search"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </InputGroup>
    )
  },
)
SearchInputField.displayName = 'SearchInputField'

function mobileSearchFieldClassName(expanded: boolean) {
  return cn(
    'h-9 w-full min-w-0 border border-input bg-transparent shadow-none',
    'focus-within:outline-none focus-within:ring-0 focus-within:ring-offset-0',
    expanded ? 'gap-2 px-2' : 'justify-center gap-0 px-0 [&_input]:max-w-0 [&_input]:opacity-0',
  )
}

function MobileHeaderSearch({
  value,
  onChange,
  onClear,
  disabled,
  onKeyDown,
  id: _id,
  'aria-label': ariaLabel = 'Search',
  ...props
}: SearchInputFieldProps) {
  const ctx = React.useContext(PageHeaderSearchContext)
  const expanded = ctx?.expanded ?? false
  const revealed = ctx?.revealed ?? false
  const overlayEl = ctx?.overlayEl ?? null
  const inputRef = React.useRef<HTMLInputElement>(null)
  const hasValue = typeof value === 'string' ? value.length > 0 : Boolean(value)

  React.useEffect(() => {
    if (expanded) inputRef.current?.focus()
  }, [expanded])

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (event.key === 'Enter' || event.key === 'Escape') {
      event.preventDefault()
      ctx?.close()
    }
  }

  const field = (
    <SearchInputField
      ref={inputRef}
      className={mobileSearchFieldClassName(expanded)}
      value={value}
      onChange={onChange}
      onClear={onClear}
      disabled={disabled}
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      tabIndex={expanded ? 0 : -1}
      {...props}
    />
  )

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={ariaLabel}
        aria-pressed={hasValue}
        aria-expanded={expanded}
        disabled={disabled}
        className={cn(
          'h-9 w-9 shrink-0 sm:hidden',
          revealed && 'invisible',
          hasValue && !revealed && 'border-primary text-primary',
        )}
        onClick={() => ctx?.open()}
      >
        <Search className="h-4 w-4" aria-hidden />
      </Button>
      {overlayEl ? createPortal(field, overlayEl) : null}
    </>
  )
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ compactOnMobile, className, ...props }, ref) => {
    const headerSearch = React.useContext(PageHeaderSearchContext)
    const compact = compactOnMobile ?? headerSearch !== null

    if (!compact) {
      return <SearchInputField ref={ref} className={className} {...props} />
    }

    return (
      <>
        <MobileHeaderSearch {...props} />
        <SearchInputField ref={ref} className={cn('hidden sm:flex', className)} {...props} />
      </>
    )
  },
)
SearchInput.displayName = 'SearchInput'

export { SearchInput }
