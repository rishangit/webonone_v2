import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PlatformServiceFrame } from '@webonone/platform-embed'
import {
  CORE_NAV_QUERY_PARAM,
  dataSentinelToExternalPath,
  designSentinelToExternalPath,
  emailSentinelToExternalPath,
  identitySentinelToExternalPath,
  isDataEntityKey,
  paymentSentinelToExternalPath,
  profileSentinelToExternalPath,
  smsSentinelToExternalPath,
  toCoreNavQueryValue,
} from '@webonone/platform-nav'
import { useAppSelector } from '@/app/store/hooks'
import { getIdentityOrigin } from '@/features/auth/utils/identityConfig'
import { getDataOrigin } from '@/features/data/utils/dataConfig'
import { getDesignOrigin } from '@/features/design/utils/designConfig'
import { getEmailOrigin } from '@/features/email/utils/emailConfig'
import { getPaymentOrigin } from '@/features/payment/utils/paymentConfig'
import { getSmsOrigin } from '@/features/sms/utils/smsConfig'
import { getNavVariantForSessionRole } from '@/features/session/utils/sessionNav'
import { usePlatformMediaDialog } from '@/features/media/PlatformMediaDialogContext'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { usePlatformPeerDialog } from '@/features/shell/PlatformPeerDialogContext'

const PEER_LABELS: Record<PlatformPeerId, string> = {
  email: 'Email',
  data: 'Data',
  identity: 'Profile',
  sms: 'SMS',
  payment: 'Payment',
  design: 'Design',
}

export type PlatformPeerId = 'email' | 'data' | 'identity' | 'sms' | 'payment' | 'design'

type PlatformPeerFrameProps = {
  peer: PlatformPeerId
}

function resolvePeerPath(peer: PlatformPeerId, pathname: string): string {
  if (peer === 'email') {
    const mapped = emailSentinelToExternalPath(pathname)
    if (mapped) return mapped
    if (pathname.startsWith('/email/')) {
      const suffix = pathname.slice('/email'.length)
      if (!suffix || suffix.includes('..')) return '/send'
      return suffix
    }
    return '/send'
  }
  if (peer === 'sms') {
    return smsSentinelToExternalPath(pathname) ?? '/send'
  }
  if (peer === 'payment') {
    return paymentSentinelToExternalPath(pathname) ?? '/invoices'
  }
  if (peer === 'design') {
    return designSentinelToExternalPath(pathname) ?? '/forms'
  }
  if (peer === 'identity') {
    return (
      identitySentinelToExternalPath(pathname) ??
      profileSentinelToExternalPath(pathname) ??
      '/profile'
    )
  }
  const dataMapped = dataSentinelToExternalPath(pathname)
  if (dataMapped) return dataMapped
  if (pathname.startsWith('/data/')) {
    const suffix = pathname.slice('/data'.length)
    return suffix || '/tags'
  }
  return '/tags'
}

function resolvePeerOrigin(peer: PlatformPeerId): string {
  if (peer === 'email') {
    return getEmailOrigin()
  }
  if (peer === 'sms') {
    return getSmsOrigin()
  }
  if (peer === 'payment') {
    return getPaymentOrigin()
  }
  if (peer === 'design') {
    return getDesignOrigin()
  }
  if (peer === 'identity') {
    return getIdentityOrigin()
  }
  return getDataOrigin()
}

function listAllowedPeerDialogBodyOrigins(): Set<string> {
  const origins = [
    getDesignOrigin(),
    getIdentityOrigin(),
    getDataOrigin(),
    getEmailOrigin(),
    getSmsOrigin(),
    getPaymentOrigin(),
  ]
  const allowed = new Set<string>()
  for (const origin of origins) {
    try {
      allowed.add(new URL(origin).origin)
    } catch {
      // skip invalid env defaults
    }
  }
  return allowed
}

/**
 * Prefer request.bodyOrigin when it matches a known peer origin (cross-peer dialogs).
 * Otherwise keep the requesting frame's origin.
 */
function resolvePeerDialogBodyOrigin(
  requestingPeerOrigin: string,
  bodyOrigin: string | undefined,
): string {
  if (!bodyOrigin?.trim()) return requestingPeerOrigin
  try {
    const requested = new URL(bodyOrigin.trim()).origin
    if (listAllowedPeerDialogBodyOrigins().has(requested)) {
      return requested
    }
  } catch {
    // fall through
  }
  return requestingPeerOrigin
}

/**
 * Allow Email top-level routes and template nested paths
 * (`/email/templates/:id`, `/preview`, `/versions`). Path may include a query string.
 */
function isAllowedEmailShellNavigatePath(path: string): boolean {
  const pathname = path.split('?')[0] ?? path
  if (!pathname.startsWith('/email/')) return false
  const parts = pathname.slice(1).split('/').filter(Boolean)
  if (parts[0] !== 'email' || parts.length < 2) return false
  if (parts.some((part) => !part || part.includes('..'))) return false

  const section = parts[1]
  const topLevel = new Set([
    'send',
    'queue',
    'history',
    'templates',
    'settings',
    'providers',
    'test',
  ])
  if (!topLevel.has(section ?? '')) return false

  if (section === 'templates') {
    if (parts.length === 2 || parts.length === 3) return true
    if (parts.length === 4 && (parts[3] === 'preview' || parts[3] === 'versions')) {
      return true
    }
    return false
  }

  return parts.length === 2
}

/**
 * Allow SMS top-level routes and template nested paths
 * (`/sms/templates/:id`, `/preview`, `/versions`). Path may include a query string.
 */
function isAllowedSmsShellNavigatePath(path: string): boolean {
  const pathname = path.split('?')[0] ?? path
  if (!pathname.startsWith('/sms/')) return false
  const parts = pathname.slice(1).split('/').filter(Boolean)
  if (parts[0] !== 'sms' || parts.length < 2) return false
  if (parts.some((part) => !part || part.includes('..'))) return false

  const section = parts[1]
  const topLevel = new Set(['send', 'devices', 'queue', 'history', 'templates'])
  if (!topLevel.has(section ?? '')) return false

  if (section === 'templates') {
    if (parts.length === 2 || parts.length === 3) return true
    if (parts.length === 4 && (parts[3] === 'preview' || parts[3] === 'versions')) {
      return true
    }
    return false
  }

  return parts.length === 2
}

/**
 * Allow `/data/{entity}`, `/data/{entity}/:id`, and nested product variant
 * `/data/products/:productId/variants/:variantId`. Path may include a query string.
 */
function isAllowedDataShellNavigatePath(path: string): boolean {
  const pathname = path.split('?')[0] ?? path
  if (!pathname.startsWith('/data/')) return false
  const parts = pathname.slice(1).split('/').filter(Boolean)
  if (parts[0] !== 'data') return false

  if (
    parts.length === 5 &&
    parts[1] === 'products' &&
    parts[3] === 'variants' &&
    parts[2] &&
    parts[4] &&
    !parts[2].includes('..') &&
    !parts[4].includes('..')
  ) {
    return true
  }

  if (parts.length < 2 || parts.length > 3) return false
  if (!isDataEntityKey(parts[1] ?? '')) return false
  if (parts.length === 3 && (!parts[2] || parts[2].includes('..'))) return false
  return true
}

function isAllowedDesignShellNavigatePath(path: string): boolean {
  const pathname = path.split('?')[0] ?? path
  if (!pathname.startsWith('/design/')) return false
  const parts = pathname.slice(1).split('/').filter(Boolean)
  if (parts[0] !== 'design' || parts.length < 2) return false
  if (parts.some((part) => !part || part.includes('..'))) return false
  if (parts[1] !== 'forms') return false
  // /design/forms or /design/forms/:id/edit or /design/forms/:id/fill
  if (parts.length === 2) return true
  if (parts.length === 4 && (parts[3] === 'edit' || parts[3] === 'fill')) return true
  return false
}

/**
 * Allow `/identity/users` (list) and `/identity/users/:id` (detail) only.
 * Path may include a query string. Kept tight to the Users list/detail shape —
 * mirrors `isIdentityNavSentinel` / `identitySentinelToExternalPath` in
 * `@webonone/platform-nav`.
 */
function isAllowedIdentityShellNavigatePath(path: string): boolean {
  const pathname = path.split('?')[0] ?? path
  if (!pathname.startsWith('/identity/')) return false
  const parts = pathname.slice(1).split('/').filter(Boolean)
  if (parts[0] !== 'identity' || parts.length < 2) return false
  if (parts.some((part) => !part || part.includes('..'))) return false
  if (parts[1] !== 'users') return false
  // /identity/users or /identity/users/:id
  if (parts.length === 2) return true
  return parts.length === 3
}

export function PlatformPeerFrame({ peer }: PlatformPeerFrameProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const [frameLoading, setFrameLoading] = useState(true)
  const { openMediaDialog } = usePlatformMediaDialog()
  const { openPeerDialog } = usePlatformPeerDialog()

  const peerPath = useMemo(
    () => resolvePeerPath(peer, location.pathname),
    [location.pathname, peer],
  )

  const peerOrigin = resolvePeerOrigin(peer)

  const searchParams = useMemo(() => {
    const navVariant = getNavVariantForSessionRole(activeRole)
    const params: Record<string, string> = {
      [CORE_NAV_QUERY_PARAM]: toCoreNavQueryValue(navVariant),
    }
    const tab = new URLSearchParams(location.search).get('tab')
    if (tab) {
      params.tab = tab
    }
    return params
  }, [activeRole, location.search])

  const handleLoadingChange = useCallback((loading: boolean) => {
    setFrameLoading(loading)
  }, [])

  const handlePeerDialogRequest = useCallback(
    (
      request: Parameters<typeof openPeerDialog>[0],
      responder: Parameters<typeof openPeerDialog>[1],
      requestingPeerOrigin: string,
    ) => {
      const bodyOrigin = resolvePeerDialogBodyOrigin(requestingPeerOrigin, request.bodyOrigin)
      openPeerDialog(request, responder, bodyOrigin)
    },
    [openPeerDialog],
  )

  const handlePeerNavigate = useCallback(
    (path: string) => {
      if (peer === 'data') {
        if (!isAllowedDataShellNavigatePath(path)) return
        const [pathname = path, query = ''] = path.split('?')
        navigate({ pathname, search: query ? `?${query}` : undefined })
        return
      }
      if (peer === 'email') {
        if (!isAllowedEmailShellNavigatePath(path)) return
        const [pathname = path, query = ''] = path.split('?')
        navigate({ pathname, search: query ? `?${query}` : undefined })
        return
      }
      if (peer === 'sms') {
        if (!isAllowedSmsShellNavigatePath(path)) return
        const [pathname = path, query = ''] = path.split('?')
        navigate({ pathname, search: query ? `?${query}` : undefined })
        return
      }
      if (peer === 'design') {
        if (!isAllowedDesignShellNavigatePath(path)) return
        const [pathname = path, query = ''] = path.split('?')
        navigate({ pathname, search: query ? `?${query}` : undefined })
        return
      }
      if (peer === 'identity') {
        if (!isAllowedIdentityShellNavigatePath(path)) return
        const [pathname = path, query = ''] = path.split('?')
        // Empty search clears prior `?tab=` (undefined can preserve it).
        navigate({ pathname, search: query ? `?${query}` : '' })
      }
    },
    [navigate, peer],
  )

  usePlatformLoading(frameLoading ? `Loading ${PEER_LABELS[peer]}…` : null)

  if (!accessToken) {
    return null
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      <PlatformServiceFrame
        peerOrigin={peerOrigin}
        peerPath={peerPath}
        accessToken={accessToken}
        searchParams={searchParams}
        title={`${PEER_LABELS[peer]} workspace`}
        className="block h-full min-h-0 w-full flex-1 border-0 bg-transparent"
        onLoadingChange={handleLoadingChange}
        onMediaDialogRequest={openMediaDialog}
        onPeerDialogRequest={handlePeerDialogRequest}
        onPeerNavigate={
          peer === 'data' ||
          peer === 'email' ||
          peer === 'sms' ||
          peer === 'design' ||
          peer === 'identity'
            ? handlePeerNavigate
            : undefined
        }
      />
    </div>
  )
}
