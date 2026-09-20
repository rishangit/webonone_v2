import { type ReactNode } from 'react'
import { ListPageActions, Tabs, TabsList, TabsTrigger } from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import type { WebsiteSection } from '../types'
import { isLocalWebsitePreviewHost } from '../utils/companyPublicHost'

const SECTIONS: WebsiteSection[] = [
  'pages',
  'layouts',
  'headers',
  'footers',
  'presets',
  'datasets',
  'themes',
  'media',
  'settings',
]

export function WebsiteHubTabs({
  section,
  actions,
  actionsVariant = 'list',
}: {
  section: WebsiteSection
  actions?: ReactNode
  /** `list` — search/filter/add row with mobile collapse; `end` — right-aligned controls only (e.g. upload). */
  actionsVariant?: 'list' | 'end'
}) {
  const { t } = useTranslation('website')
  const { goToWebsite } = useNavigateDesign()

  return (
    <div className="flex w-full flex-col gap-2">
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
        actionsVariant === 'end' ? (
          <div className="flex w-full flex-wrap items-center justify-end gap-2">{actions}</div>
        ) : (
          <ListPageActions>{actions}</ListPageActions>
        )
      ) : null}
    </div>
  )
}

export function websiteLiveUrl(liveOrigin: string | null | undefined, companyId: string, path: string): string {
  const suffix = path ? `/${path}` : ''
  if (!isLocalWebsitePreviewHost() && liveOrigin) {
    return `${liveOrigin.replace(/\/$/, '')}${suffix}`
  }
  return `${window.location.origin}/s/${companyId}${suffix}`
}
