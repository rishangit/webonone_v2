import { useCallback, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { PlatformServiceFrame } from '@webonone/platform-embed'
import {
  CORE_NAV_QUERY_PARAM,
  dataSentinelToExternalPath,
  emailSentinelToExternalPath,
  identitySentinelToExternalPath,
  profileSentinelToExternalPath,
  toCoreNavQueryValue,
} from '@webonone/platform-nav'
import { useAppSelector } from '@/app/store/hooks'
import { getIdentityOrigin } from '@/features/auth/utils/identityConfig'
import { getDataOrigin } from '@/features/data/utils/dataConfig'
import { getEmailOrigin } from '@/features/email/utils/emailConfig'
import { getNavVariantForSessionRole } from '@/features/session/utils/sessionNav'
import { usePlatformMediaDialog } from '@/features/media/PlatformMediaDialogContext'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'

const PEER_LABELS: Record<PlatformPeerId, string> = {
  email: 'Email',
  data: 'Data',
  identity: 'Profile',
}

export type PlatformPeerId = 'email' | 'data' | 'identity'

type PlatformPeerFrameProps = {
  peer: PlatformPeerId
}

function resolvePeerPath(peer: PlatformPeerId, pathname: string): string {
  if (peer === 'email') {
    return emailSentinelToExternalPath(pathname) ?? '/history'
  }
  if (peer === 'identity') {
    return (
      identitySentinelToExternalPath(pathname) ??
      profileSentinelToExternalPath(pathname) ??
      '/profile'
    )
  }
  return dataSentinelToExternalPath(pathname) ?? '/'
}

function resolvePeerOrigin(peer: PlatformPeerId): string {
  if (peer === 'email') {
    return getEmailOrigin()
  }
  if (peer === 'identity') {
    return getIdentityOrigin()
  }
  return getDataOrigin()
}

export function PlatformPeerFrame({ peer }: PlatformPeerFrameProps) {
  const location = useLocation()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const [frameLoading, setFrameLoading] = useState(true)
  const { openMediaDialog } = usePlatformMediaDialog()

  const peerPath = useMemo(
    () => resolvePeerPath(peer, location.pathname),
    [location.pathname, peer],
  )

  const peerOrigin = resolvePeerOrigin(peer)

  const searchParams = useMemo(() => {
    const navVariant = getNavVariantForSessionRole(activeRole)
    return {
      [CORE_NAV_QUERY_PARAM]: toCoreNavQueryValue(navVariant),
    }
  }, [activeRole])

  const handleLoadingChange = useCallback((loading: boolean) => {
    setFrameLoading(loading)
  }, [])

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
      />
    </div>
  )
}
