import { useCallback, useMemo, useState } from 'react'

import { useLocation } from 'react-router-dom'

import { PlatformServiceFrame } from '@webonone/platform-embed'

import {

  CORE_NAV_QUERY_PARAM,

  dataSentinelToExternalPath,

  emailSentinelToExternalPath,

  profileSentinelToExternalPath,

  toCoreNavQueryValue,

} from '@webonone/platform-nav'

import { buildThemePayload, serializeThemeQueryParams } from '@webonone/theme'

import { useAppSelector } from '@/app/store/hooks'

import { getIdentityApiBase, getIdentityOrigin } from '@/features/auth/utils/identityConfig'

import { getDataOrigin } from '@/features/data/utils/dataConfig'

import { getEmailOrigin } from '@/features/email/utils/emailConfig'

import { getNavVariantForSessionRole } from '@/features/session/utils/sessionNav'

import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'

import { toThemeDto } from '@/features/settings/system-theme/services/themeApi'



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

    return profileSentinelToExternalPath(pathname) ?? '/profile'

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

  const preferences = useAppSelector((s) => s.systemTheme.preferences)

  const [frameError, setFrameError] = useState<string | null>(null)

  const [frameLoading, setFrameLoading] = useState(true)



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



    if (preferences) {

      Object.assign(

        params,

        serializeThemeQueryParams(

          buildThemePayload(toThemeDto(preferences.theme), preferences.colorMode),

        ),

      )

    }



    return params

  }, [activeRole, preferences])



  const handleLoadingChange = useCallback((loading: boolean) => {

    setFrameLoading(loading)

    if (loading) {

      setFrameError(null)

    }

  }, [])



  const handleError = useCallback((message: string) => {

    setFrameError(message)

    setFrameLoading(false)

  }, [])



  usePlatformLoading(frameLoading ? `Loading ${PEER_LABELS[peer]}…` : null)



  if (!accessToken) {

    return null

  }



  return (

    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden">

      {frameError ? <p className="absolute left-2 top-2 z-10 text-sm text-destructive">{frameError}</p> : null}

      <PlatformServiceFrame

        peerOrigin={peerOrigin}

        peerPath={peerPath}

        accessToken={accessToken}

        authCodeEndpoint={`${getIdentityApiBase()}/auth/code`}

        searchParams={searchParams}

        title={`${PEER_LABELS[peer]} workspace`}

        className="block h-full min-h-0 w-full flex-1 border-0 bg-transparent"

        onLoadingChange={handleLoadingChange}

        onError={handleError}

      />

    </div>

  )

}


