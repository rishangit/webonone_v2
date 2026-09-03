import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Home, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { normalizeLocale, type AppLocale } from '@webonone/i18n'
import { AppHeader, BrandLogo, Button, SearchInput } from '@webonone/ui-kit'
import { changeAppLocale } from '@/features/shell/utils/changeAppLocale'
import { getWebOnOneOrigin, getWebsiteOrigin } from '@/features/docs/utils/peerConfig'

interface SupportHeaderProps {
  className?: string
  showMenuButton?: boolean
  menuOpen?: boolean
  onMenuClick?: () => void
}

export function SupportHeader({
  className,
  showMenuButton = false,
  menuOpen = false,
  onMenuClick,
}: SupportHeaderProps) {
  const { t, i18n } = useTranslation('common')
  const { t: ts } = useTranslation('shell')
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const currentLocale = normalizeLocale(i18n.language)

  const handleLocaleChange = useCallback((locale: AppLocale) => {
    void changeAppLocale(locale)
  }, [])

  const headerLabels = useMemo(
    () => ({
      language: t('language'),
      english: t('english'),
      sinhala: t('sinhala'),
    }),
    [t],
  )

  function submitSearch() {
    const next = query.trim()
    if (!next) {
      navigate('/search')
      return
    }
    navigate(`/search?q=${encodeURIComponent(next)}`)
  }

  return (
    <AppHeader
      className={className}
      logo={<BrandLogo href="/">{ts('brand')}</BrandLogo>}
      locale={currentLocale}
      onLocaleChange={handleLocaleChange}
      labels={headerLabels}
      showMenuButton={showMenuButton}
      menuOpen={menuOpen}
      onMenuClick={onMenuClick}
      trailingActions={
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" asChild>
            <a href={`${getWebsiteOrigin()}/`} aria-label={ts('homeSite')}>
              <Home className="h-4 w-4" />
            </a>
          </Button>
          <Button type="button" size="icon" className="h-9 w-9 shrink-0" asChild>
            <a href={`${getWebOnOneOrigin()}/`} aria-label={ts('openApp')}>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 sm:hidden"
            aria-label={ts('searchAria')}
            onClick={() => navigate('/search')}
          >
            <Search className="h-4 w-4" />
          </Button>
          <SearchInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery('')}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                submitSearch()
              }
            }}
            placeholder={ts('searchPlaceholder')}
            aria-label={ts('searchAria')}
            className="hidden w-40 sm:flex md:w-48 lg:w-56"
          />
        </div>
      }
    />
  )
}
