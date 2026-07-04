import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { CORE_NAV_QUERY_PARAM, parsePlatformNavVariant } from '@webonone/platform-nav'
import { useAppDispatch } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import {
  bootstrapPlatformSession,
  getDataRedirectUri,
} from '@/features/auth/utils/bootstrapPlatformSession'
import { fetchDataRole } from '@/features/auth/utils/fetchDataRole'
import {
  buildPlatformSearchWithoutCode,
  hasPlatformHandoff,
  parsePlatformReturnUrl,
} from '@/features/auth/utils/platformReturn'

type PlatformBootstrapState = {
  isBootstrapping: boolean
  bootstrapError: string | null
}

/** Survives React StrictMode remounts — one exchange per auth code. */
const exchangedPlatformCodes = new Set<string>()

export function usePlatformSessionBootstrap(): PlatformBootstrapState {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const code = searchParams.get('code')
  const isHandoff = hasPlatformHandoff(searchParams)
  const [bootstrapError, setBootstrapError] = useState<string | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(() => Boolean(code && isHandoff))

  useEffect(() => {
    if (!code || !isHandoff) {
      setIsBootstrapping(false)
      return
    }

    if (exchangedPlatformCodes.has(code)) {
      setIsBootstrapping(false)
      return
    }

    exchangedPlatformCodes.add(code)
    setIsBootstrapping(true)
    setBootstrapError(null)

    const validatedReturnUrl = parsePlatformReturnUrl(searchParams)
    const coreNavVariant = parsePlatformNavVariant(searchParams.get(CORE_NAV_QUERY_PARAM))
    const redirectUri = getDataRedirectUri(location.pathname)

    bootstrapPlatformSession(code, redirectUri)
      .then(async (result) => {
        const role = await fetchDataRole(result.accessToken)

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
              role,
            },
          }),
        )

        navigate(
          { pathname: location.pathname, search: buildPlatformSearchWithoutCode(searchParams) },
          { replace: true },
        )
      })
      .catch((err: Error) => {
        exchangedPlatformCodes.delete(code)
        setBootstrapError(err.message)
      })
      .finally(() => {
        setIsBootstrapping(false)
      })
  }, [code, dispatch, isHandoff, location.pathname, navigate, searchParams])

  return {
    isBootstrapping: isHandoff && isBootstrapping,
    bootstrapError: isHandoff ? bootstrapError : null,
  }
}
