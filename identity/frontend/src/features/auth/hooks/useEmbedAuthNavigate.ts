import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { sendAuthNavigate } from '@webonone/platform-embed'
import { mapIdentityAuthPathToParent } from '../utils/embedAuthNavigate'
import { useEmbedLoginMode } from './useEmbedLoginMode'

type NavigateAuthOptions = {
  replace?: boolean
  state?: unknown
}

export function useEmbedAuthNavigate() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isEmbed, parentOrigin } = useEmbedLoginMode()

  const navigateAuth = useCallback(
    (identityPath: string, options?: NavigateAuthOptions) => {
      if (isEmbed && parentOrigin) {
        const target = mapIdentityAuthPathToParent(identityPath, searchParams)
        sendAuthNavigate(parentOrigin, target)
        return
      }

      if (options?.replace) {
        navigate(identityPath, { replace: true, state: options.state })
      } else {
        navigate(identityPath, { state: options?.state })
      }
    },
    [isEmbed, navigate, parentOrigin, searchParams],
  )

  const getAuthHref = useCallback(
    (identityPath: string): string => {
      if (isEmbed) {
        const target = mapIdentityAuthPathToParent(identityPath, searchParams)
        return `${target.pathname}${target.search ?? ''}`
      }
      return identityPath
    },
    [isEmbed, searchParams],
  )

  return { navigateAuth, getAuthHref, isEmbed }
}
