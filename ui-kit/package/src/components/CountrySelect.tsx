import * as React from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../lib/utils'
import {
  PHONE_COUNTRIES,
  getFlagEmoji,
  getPhoneCountryByIso2,
  type PhoneCountry,
} from '../data/phoneCountries'
import { SearchInput } from './SearchInput'
import { Popover, PopoverContent, PopoverTrigger } from './Popover'

export interface CountrySelectProps {
  value: string
  onValueChange: (country: PhoneCountry) => void
  disabled?: boolean
  id?: string
  placeholder?: string
  invalid?: boolean
}

function normalizeSearchTerm(term: string): string {
  return term.trim().toLowerCase().replace(/^\+/, '')
}

function countryMatchesSearch(country: PhoneCountry, term: string): boolean {
  if (!term) return true
  const dial = country.dialCode.replace(/^\+/, '')
  return (
    country.name.toLowerCase().includes(term) ||
    country.iso2.toLowerCase().includes(term) ||
    dial.includes(term)
  )
}

function CountrySelect({
  value,
  onValueChange,
  disabled,
  id,
  placeholder = 'Select country',
  invalid,
}: CountrySelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [highlightedIndex, setHighlightedIndex] = React.useState(0)
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  const selected = value ? getPhoneCountryByIso2(value) : undefined
  const normalizedSearch = normalizeSearchTerm(search)
  const filteredCountries = React.useMemo(
    () => PHONE_COUNTRIES.filter((country) => countryMatchesSearch(country, normalizedSearch)),
    [normalizedSearch],
  )

  React.useEffect(() => {
    if (open) {
      setSearch('')
      setHighlightedIndex(0)
      requestAnimationFrame(() => searchInputRef.current?.focus())
    }
  }, [open])

  React.useEffect(() => {
    if (highlightedIndex >= filteredCountries.length) {
      setHighlightedIndex(Math.max(0, filteredCountries.length - 1))
    }
  }, [filteredCountries.length, highlightedIndex])

  React.useEffect(() => {
    const list = listRef.current
    if (!list || !open) return
    const item = list.children[highlightedIndex] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex, open])

  function selectCountry(country: PhoneCountry) {
    onValueChange(country)
    setOpen(false)
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((index) => Math.min(index + 1, filteredCountries.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const country = filteredCountries[highlightedIndex]
      if (country) selectCountry(country)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-label="Country"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-invalid={invalid}
          className={cn(
            'ui-shape-control flex h-10 w-full items-center justify-between border border-input bg-background px-3 py-2 text-sm',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            invalid && 'border-destructive',
          )}
        >
          <span className="flex min-w-0 items-center gap-2 truncate text-left">
            {selected ? (
              <>
                <span className="text-base leading-none" aria-hidden>
                  {getFlagEmoji(selected.iso2)}
                </span>
                <span className="truncate">{selected.name}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[16rem] p-2" align="start">
        <SearchInput
          ref={searchInputRef}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setHighlightedIndex(0)
          }}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search country"
          aria-label="Search countries"
          className="mb-2 h-9"
        />
        <div
          ref={listRef}
          role="listbox"
          aria-label="Countries"
          className="max-h-60 overflow-y-auto"
        >
          {filteredCountries.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">No countries found.</p>
          ) : (
            filteredCountries.map((country, index) => {
              const isSelected = country.iso2 === selected?.iso2
              const isHighlighted = index === highlightedIndex
              return (
                <button
                  key={country.iso2}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm',
                    isHighlighted
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground',
                  )}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectCountry(country)}
                >
                  <span className="text-base leading-none" aria-hidden>
                    {getFlagEmoji(country.iso2)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{country.name}</span>
                  {isSelected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { CountrySelect }
