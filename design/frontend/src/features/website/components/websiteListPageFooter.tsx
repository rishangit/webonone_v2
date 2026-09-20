import { ListPageFooter, type ListPageFooterProps } from '@webonone/ui-kit'
import { WEBSITE_LIST_PAGE_SIZE_OPTIONS } from './WebsiteHubListToolbar'
import type { WebsiteCatalogListController } from './websiteListPageTypes'

export function websiteListPageFooterProps(list: WebsiteCatalogListController): ListPageFooterProps {
  return {
    className: 'mt-auto',
    currentPage: list.page,
    pageSize: list.pageSize,
    totalCount: list.total,
    loadedCount: list.items.length,
    hasMore: list.hasMore,
    loadingMore: list.loadingMore,
    pageSizeOptions: [...WEBSITE_LIST_PAGE_SIZE_OPTIONS],
    onPageChange: (next) => list.load(next, list.pageSize, true),
    onPageSizeChange: (next) => list.load(1, next, true),
    onLoadMore: () => list.loadMore(),
    onModeChange: () => list.load(1, list.pageSize, true),
  }
}

export function WebsiteListPageFooter({ list }: { list: WebsiteCatalogListController }) {
  const props = websiteListPageFooterProps(list)
  const { className, ...rest } = props
  return <ListPageFooter className={className} {...rest} />
}
