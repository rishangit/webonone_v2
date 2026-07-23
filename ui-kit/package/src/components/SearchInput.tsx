import * as React from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { Input, type InputProps } from './Input'
import { InputGroup, InputGroupIcon } from './InputGroup'

export interface SearchInputProps extends Omit<InputProps, 'type'> {
  onClear?: () => void
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
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
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-transparent text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
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
SearchInput.displayName = 'SearchInput'

export { SearchInput }
