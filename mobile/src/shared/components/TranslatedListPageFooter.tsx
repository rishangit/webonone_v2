import { ListPageFooter, type ListPageFooterProps } from '@webonone/mobile-ui'
import { useListCountSummary } from '@/shared/hooks/useListCountSummary'

/** App list footer — uses the shared `common.showingCount` locale string. */
export function TranslatedListPageFooter({
  loadedCount,
  totalCount,
  ...rest
}: Omit<ListPageFooterProps, 'summary'>) {
  const summary = useListCountSummary(loadedCount, totalCount)
  return (
    <ListPageFooter
      loadedCount={loadedCount}
      totalCount={totalCount}
      summary={summary}
      {...rest}
    />
  )
}
