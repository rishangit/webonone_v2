import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

const ALLOWED_PARENT_ORIGINS = (
  import.meta.env.VITE_ALLOWED_PARENT_ORIGINS ??
  import.meta.env.VITE_ALLOWED_FRAME_ANCESTORS ??
  'http://localhost:3000'
)
  .split(',')
  .map((o: string) => o.trim())
  .filter(Boolean)

function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_PARENT_ORIGINS.includes(origin)
}

export function useEmbedMode() {
  const [searchParams] = useSearchParams()
  const parentOrigin = searchParams.get('parentOrigin')
  const returnPath = searchParams.get('returnPath') ?? '/'

  return useMemo(() => {
    const isEmbed = Boolean(parentOrigin && isAllowedOrigin(parentOrigin))
    return {
      isEmbed,
      parentOrigin: isEmbed ? parentOrigin! : null,
      returnPath,
    }
  }, [parentOrigin, returnPath])
}

export function postAuthSuccess(
  parentOrigin: string,
  payload: {
    accessToken: string
    expiresIn: number
    user: { id: string; email: string; displayName: string }
  },
) {
  if (!isAllowedOrigin(parentOrigin)) return
  window.parent.postMessage(
    {
      type: 'webonone:auth:success',
      accessToken: payload.accessToken,
      expiresIn: payload.expiresIn,
      user: payload.user,
    },
    parentOrigin,
  )
}
