import { useCallback, useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { BrandLogo, PageShell } from '@webonone/ui-kit'
import { normalizeLocale, type AppLocale } from '@webonone/i18n'
import { changeAppLocale } from '@/features/shell/utils/changeAppLocale'

type GuestAuthLayoutProps = {
  children: ReactNode
}

export function GuestAuthLayout({ children }: GuestAuthLayoutProps) {
  const { t, i18n } = useTranslation('common')
  const { t: tShell } = useTranslation('shell')
  const currentLocale = normalizeLocale(i18n.language)

  const headerLabels = useMemo(
    () => ({
      language: t('language'),
      english: t('english'),
      sinhala: t('sinhala'),
      profile: t('profile'),
      logout: t('logout'),
    }),
    [t],
  )

  const handleLocaleChange = useCallback((locale: AppLocale) => {
    void changeAppLocale(locale)
  }, [])

  return (
    <PageShell
      logo={<BrandLogo>{tShell('brand')}</BrandLogo>}
      locale={currentLocale}
      onLocaleChange={handleLocaleChange}
      headerLabels={headerLabels}
      className="flex h-screen flex-col overflow-hidden"
      mainClassName="flex min-h-0 flex-1 flex-col overflow-hidden px-0 py-0"
    >
      <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </PageShell>
  )
}
