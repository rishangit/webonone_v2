import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CORE_NAV_QUERY_PARAM, parsePlatformNavVariant } from '@webonone/platform-nav'
import { useAppDispatch } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import {
  bootstrapPlatformSession,
  getEmailRedirectUri,
} from '@/features/auth/utils/bootstrapPlatformSession'
import {
  buildPlatformSearchWithoutCode,
  hasPlatformHandoff,
  parsePlatformReturnUrl,
} from '@/features/auth/utils/platformReturn'

const exchangedCodes = new Set<string>()

type PlatformBootstrapState = {
  isBootstrapping: boolean
  bootstrapError: string | null
  hasCode: boolean
}

export function usePlatformSessionBootstrap(homePathname: string): PlatformBootstrapState {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [bootstrapError, setBootstrapError] = useState<string | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const bootstrapRef = useRef(false)

  const code = searchParams.get('code')

  useEffect(() => {
    if (!code || !hasPlatformHandoff(searchParams) || bootstrapRef.current) {
      return
    }
    if (exchangedCodes.has(code)) {
      return
    }

    bootstrapRef.current = true
    exchangedCodes.add(code)
    setIsBootstrapping(true)
    setBootstrapError(null)

    const validatedReturnUrl = parsePlatformReturnUrl(searchParams)
    const coreNavVariant = parsePlatformNavVariant(searchParams.get(CORE_NAV_QUERY_PARAM))
    const redirectUri = getEmailRedirectUri(homePathname)

    bootstrapPlatformSession(code, redirectUri)
      .then((result) => {
        if (validatedReturnUrl) {
          dispatch(
            authActions.setPlatformContext({
              returnUrl: validatedReturnUrl,
              coreNavVariant,
            }),
          )
        }

        dispatch(
          authActions.loginSuccess({
            accessToken: result.accessToken,
            user: {
              id: result.user.id,
              email: result.user.email,
              displayName: result.user.displayName,
              avatarUrl: result.user.avatarUrl ?? null,
              role: 'member',
            },
          }),
        )

        navigate(
          { pathname: homePathname, search: buildPlatformSearchWithoutCode(searchParams) },
          { replace: true },
        )
      })
      .catch((err: Error) => {
        bootstrapRef.current = false
        exchangedCodes.delete(code)
        setBootstrapError(err.message)
      })
      .finally(() => {
        setIsBootstrapping(false)
      })
  }, [code, dispatch, homePathname, navigate, searchParams])

  return {
    isBootstrapping,
    bootstrapError,
    hasCode: Boolean(code),
  }
}
