import type { FormEvent } from 'react'
import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Input, InputGroup, InputGroupIcon, Spinner, cn } from '@webonone/ui-kit'
import { websiteSearchControlsClassName } from '@/features/website/layout/websitePageContent'

type WebsiteHomeSearchFormProps = {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  onSubmit: (event: FormEvent) => void
  loading: boolean
  hasActiveSearch: boolean
}

export function WebsiteHomeSearchForm({
  value,
  onChange,
  onClear,
  onSubmit,
  loading,
  hasActiveSearch,
}: WebsiteHomeSearchFormProps) {
  const { t: tHome } = useTranslation('home')
  const { t: tSearch } = useTranslation('search')
  const { t: tCommon } = useTranslation('common')
  const hasValue = value.length > 0
  const submitLabel = loading && hasActiveSearch ? tSearch('loading') : tHome('cta')

  return (
    <form
      className={cn('mx-auto', websiteSearchControlsClassName)}
      onSubmit={onSubmit}
    >
      <InputGroup className="h-11 gap-1 pr-1">
        <InputGroupIcon icon={Search} />
        <Input
          inGroup
          type="search"
          role="searchbox"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={tHome('searchPlaceholder')}
          aria-label={tHome('searchAria')}
          disabled={loading}
          className="min-w-0 flex-1"
        />
        {hasValue ? (
          <button
            type="button"
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-transparent text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
            )}
            onClick={onClear}
            aria-label={tCommon('clear')}
            disabled={loading}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
        <Button
          type="submit"
          size="sm"
          className="h-8 shrink-0 gap-1.5 px-3"
          disabled={loading && hasActiveSearch}
        >
          {loading && hasActiveSearch ? (
            <Spinner size="sm" className="text-primary-foreground" aria-hidden />
          ) : (
            <Search className="h-4 w-4 shrink-0" aria-hidden />
          )}
          <span className="hidden sm:inline">{submitLabel}</span>
        </Button>
      </InputGroup>
    </form>
  )
}
