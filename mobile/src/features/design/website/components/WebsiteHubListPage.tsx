import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Alert, AlertDescription, ListPageBody, Spinner } from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import { TranslatedListPageFooter } from '@/shared/components/TranslatedListPageFooter'

export type WebsiteHubListPageProps = {
  loading: boolean
  error?: string | null
  filterPanel?: ReactNode
  loadedCount: number
  totalCount: number
  hasMore: boolean
  loadingMore: boolean
  children: ReactNode
}

/**
 * Optional filter panel + list body. Search / filter / add belong in
 * `FeatureScreen` `actions` via `ListPageActions` (same as Tags, Invoices).
 */
export function WebsiteHubListPage({
  loading,
  error,
  filterPanel,
  loadedCount,
  totalCount,
  hasMore,
  loadingMore,
  children,
}: WebsiteHubListPageProps) {
  const { t } = useTranslation('website')

  return (
    <View className="min-h-0 flex-1 gap-3">
      {filterPanel}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {loading ? <Spinner label={t('loading')} /> : null}
      {!loading ? (
        <ListPageBody>
          {children}
          <TranslatedListPageFooter
            loadedCount={loadedCount}
            totalCount={totalCount}
            hasMore={hasMore}
            loadingMore={loadingMore}
          />
        </ListPageBody>
      ) : null}
    </View>
  )
}
