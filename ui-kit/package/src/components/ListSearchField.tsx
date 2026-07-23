import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from './Button'
import { Input } from './Input'
import { inputInGroupFieldClassName } from './Input'
import { InputGroup, InputGroupIcon } from './InputGroup'

export interface ListSearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  onClear?: () => void
  className?: string
  'aria-label'?: string
}

function ListSearchField({
  value,
  onChange,
  placeholder,
  onClear,
  className,
  'aria-label': ariaLabel = 'Search list',
}: ListSearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [expanded, setExpanded] = useState(value.length > 0)

  useEffect(() => {
    if (value.length > 0) {
      setExpanded(true)
    }
  }, [value])

  function handleClear() {
    onChange('')
    onClear?.()
    setExpanded(false)
  }

  function handleExpand() {
    setExpanded(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  return (
    <div className={cn('relative h-9 w-9 shrink-0', className)}>
      {!expanded ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={ariaLabel}
          className="h-9 w-9"
          onClick={handleExpand}
        >
          <Search className="h-4 w-4" />
        </Button>
      ) : null}
      {expanded ? (
        <InputGroup className="absolute right-0 top-0 z-20 w-64 max-w-[min(16rem,calc(100vw-5rem))]">
          <InputGroupIcon icon={Search} />
          <Input
            ref={inputRef}
            inGroup
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            aria-label={ariaLabel}
            className={inputInGroupFieldClassName}
            onBlur={() => {
              if (!value.trim()) {
                setExpanded(false)
              }
            }}
          />
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              aria-label="Clear search"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </InputGroup>
      ) : null}
    </div>
  )
}

export { ListSearchField }
