import type { ReactNode } from 'react'
import { Alert, AlertDescription, ListPageBody } from '@webonone/ui-kit'
import { WebsiteHubTabs } from './WebsiteHubTabs'
import { WebsiteListPageFooter } from './websiteListPageFooter'
import type { WebsiteCatalogListController } from './websiteListPageTypes'
import type { WebsiteSection } from '../types'

/**
 * Ui-kit list page body for Design Website hub sections:
 * hub tabs + ListPageActions toolbar → filter panel → alert → ListPageBody → ListPageFooter.
 */
export type WebsiteHubListPageProps = {
  section: WebsiteSection
  /** Passed to `WebsiteHubTabs` → `ListPageActions` (search, filter trigger, add). */
  toolbar: ReactNode
  list: WebsiteCatalogListController
  loading: boolean
  error?: string | null
  filterPanel?: ReactNode
  actionsVariant?: 'list' | 'end'
  children: ReactNode
}

export function WebsiteHubListPage({
  section,
  toolbar,
  list,
  loading,
  error,
  filterPanel,
  actionsVariant = 'list',
  children,
}: WebsiteHubListPageProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <WebsiteHubTabs section={section} actions={toolbar} actionsVariant={actionsVariant} />
      {filterPanel}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <ListPageBody className="min-h-0 flex-1">
        <div className="flex-1">{!loading ? children : null}</div>
        <WebsiteListPageFooter list={list} />
      </ListPageBody>
    </div>
  )
}
