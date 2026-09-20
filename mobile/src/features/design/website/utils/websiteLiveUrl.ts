import { env } from '@/shared/config/env'
import type { WebsiteLiveUrl } from '@/shared/services/websiteAdminApi'

export function websiteLivePageUrl(
  live: WebsiteLiveUrl | null | undefined,
  companyId: string,
  path: string,
): string {
  const suffix = path ? `/${path}` : ''
  if (live?.webUrl) {
    return `${live.webUrl.replace(/\/$/, '')}${suffix}`
  }
  return `${env.designOrigin}/s/${companyId}${suffix}`
}
