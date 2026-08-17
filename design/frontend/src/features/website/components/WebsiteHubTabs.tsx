import { Tabs, TabsList, TabsTrigger } from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import type { WebsiteSection } from '../types'

const SECTIONS: WebsiteSection[] = ['pages', 'headers', 'footers', 'themes', 'media']

export function WebsiteHubTabs({ section }: { section: WebsiteSection }) {
  const { t } = useTranslation('website')
  const { goToWebsite } = useNavigateDesign()

  return (
    <Tabs
      value={section}
      onValueChange={(value) => goToWebsite(`/website/${value}`)}
    >
      <TabsList aria-label={t('ariaSections')}>
        {SECTIONS.map((item) => (
          <TabsTrigger key={item} value={item}>
            {t(item)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

export function websiteLiveUrl(companyId: string, path: string): string {
  const suffix = path ? `/${path}` : ''
  return `${window.location.origin}/s/${companyId}${suffix}`
}
