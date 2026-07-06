import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAppDispatch } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store'
import { bootstrapProfileSession } from '@/features/profile/utils/bootstrapProfileSession'
import {
  buildPlatformSearchWithoutCode,
  hasAnyPlatformHandoff,
} from '@/features/auth/utils/platformReturn'

type PlatformBootstrapState = {
  isBootstrapping: boolean
  bootstrapError: string | null
}

const exchangedPlatformCodes = new Set<string>()

export function usePlatformSessionBootstrap(): PlatformBootstrapState {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const code = searchParams.get('code')
  const isHandoff = hasAnyPlatformHandoff(searchParams)
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

    bootstrapProfileSession(code)
      .then((result) => {
        dispatch(
          authActions.loginSucceeded({
            accessToken: result.accessToken,
            user: result.user,
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
