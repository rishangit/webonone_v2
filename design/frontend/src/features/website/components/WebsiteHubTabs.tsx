import { type ReactNode } from 'react'
import { ListPageActions } from '@webonone/ui-kit'
import { isLocalWebsitePreviewHost } from '../utils/companyPublicHost'

export function WebsiteHubTabs({
  actions,
  actionsVariant = 'list',
}: {
  actions?: ReactNode
  /** `list` — search/filter/add row with mobile collapse; `end` — right-aligned controls only (e.g. upload). */
  actionsVariant?: 'list' | 'end'
}) {
  if (!actions) return null

  return actionsVariant === 'end' ? (
    <div className="flex w-full flex-wrap items-center justify-end gap-2">{actions}</div>
  ) : (
    <ListPageActions>{actions}</ListPageActions>
  )
}

export function websiteLiveUrl(liveOrigin: string | null | undefined, companyId: string, path: string): string {
  const suffix = path ? `/${path}` : ''
  if (!isLocalWebsitePreviewHost() && liveOrigin) {
    return `${liveOrigin.replace(/\/$/, '')}${suffix}`
  }
  return `${window.location.origin}/s/${companyId}${suffix}`
}
