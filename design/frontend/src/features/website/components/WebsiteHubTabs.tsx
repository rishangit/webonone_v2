import { type ReactNode } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import type { WebsiteSection } from '../types'

const SECTIONS: WebsiteSection[] = ['pages', 'headers', 'footers', 'themes', 'media']

export function WebsiteHubTabs({
  section,
  actions,
}: {
  section: WebsiteSection
  actions?: ReactNode
}) {
  const { t } = useTranslation('website')
  const { goToWebsite } = useNavigateDesign()

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={section} onValueChange={(value) => goToWebsite(`/website/${value}`)}>
        <TabsList aria-label={t('ariaSections')}>
          {SECTIONS.map((item) => (
            <TabsTrigger key={item} value={item}>
              {t(item)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {actions ? (
        <div className="flex w-full flex-wrap items-center justify-end gap-2">{actions}</div>
      ) : null}
    </div>
  )
}

export function websiteLiveUrl(companyId: string, path: string): string {
  const suffix = path ? `/${path}` : ''
  return `${window.location.origin}/s/${companyId}${suffix}`
}
