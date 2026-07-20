import { CORE_NAV_QUERY_PARAM, toCoreNavQueryValue, type PlatformNavVariant } from '@webonone/platform-nav'
import type { NavConfigItem } from '@webonone/ui-kit'
import { buildPlatformSearchWithoutCode } from '@/features/auth/utils/platformReturn'

function isLocalSmsPath(to: string): boolean {
  return to.startsWith('/') && !to.startsWith('//')
}

function appendQueryString(path: string, search: string): string {
  if (!search) {
    return path
  }
  const query = search.startsWith('?') ? search : `?${search}`
  return path.includes('?') ? path : `${path}${query}`
}

export function buildPlatformSearchForNav(
  searchParams: URLSearchParams,
  platform: { returnUrl: string | null; coreNavVariant: PlatformNavVariant | null },
): string {
  const fromUrl = buildPlatformSearchWithoutCode(searchParams)
  if (fromUrl) {
    return fromUrl
  }

  if (!platform.returnUrl) {
    return ''
  }

  const params = new URLSearchParams()
  params.set('return_url', platform.returnUrl)
  if (platform.coreNavVariant) {
    params.set(CORE_NAV_QUERY_PARAM, toCoreNavQueryValue(platform.coreNavVariant))
  }
  return params.toString()
}

export function appendPlatformQueryToLocalNav(items: NavConfigItem[], search: string): NavConfigItem[] {
  if (!search) {
    return items
  }

  return items.map((item) => {
    if (item.type === 'item') {
      return isLocalSmsPath(item.to) ? { ...item, to: appendQueryString(item.to, search) } : item
    }

    return {
      ...item,
      children: item.children.map((child) =>
        isLocalSmsPath(child.to) ? { ...child, to: appendQueryString(child.to, search) } : child,
      ),
    }
  })
}
