/** Minimal list controller shape from `useEpicCatalogList` for `ListPageFooter`. */
export type WebsiteCatalogListController = {
  page: number
  pageSize: number
  total: number
  items: unknown[]
  hasMore: boolean
  loadingMore: boolean
  load: (page: number, pageSize: number, force?: boolean) => void
  loadMore: () => void
}
