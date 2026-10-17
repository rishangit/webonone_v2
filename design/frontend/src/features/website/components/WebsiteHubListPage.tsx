import type { ReactNode } from 'react'
import { Alert, AlertDescription, ListPageBody } from '@webonone/ui-kit'
import { WebsiteHubTabs } from './WebsiteHubTabs'
import { WebsiteListPageFooter } from './websiteListPageFooter'
import type { WebsiteCatalogListController } from './websiteListPageTypes'
/**
 * Ui-kit list page body for Design Website sections:
 * ListPageActions toolbar → filter panel → alert → ListPageBody → ListPageFooter.
 */
export type WebsiteHubListPageProps = {
  /** Search, filter trigger, and add — rendered in `ListPageActions`. */
  toolbar: ReactNode
  list: WebsiteCatalogListController
  loading: boolean
  error?: string | null
  filterPanel?: ReactNode
  actionsVariant?: 'list' | 'end'
  children: ReactNode
}

export function WebsiteHubListPage({
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
      <WebsiteHubTabs actions={toolbar} actionsVariant={actionsVariant} />
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
