import { serializeQuery } from './cacheUtils'

type ListPagePayload = {
  page?: number
  append?: boolean
  force?: boolean
}

type ListPageState = {
  page: number
  pageSize: number
  items: { length: number }
}

/**
 * On-scroll lists keep `page` at the last appended page. A replace without an
 * explicit page (e.g. `{ force: true }` after an AI write) must restart at page 1
 * so earlier rows are not wiped and load-more cannot loop on empty later pages.
 */
export function resolveListPage(payload: ListPagePayload, state: ListPageState): number {
  if (payload.page !== undefined) return payload.page
  if (!payload.append && state.items.length > state.pageSize) return 1
  return state.page
}

export function isCollapsedReplaceRequest(
  prev: Record<string, unknown>,
  next: Record<string, unknown> & { force?: boolean },
): boolean {
  if (next.force) return false
  return serializeQuery(prev) === serializeQuery(next)
}
