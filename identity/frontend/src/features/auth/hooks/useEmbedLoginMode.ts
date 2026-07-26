import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PLATFORM_EMBED_QUERY } from '@webonone/platform-embed'
import { isAllowedParentOrigin } from '@/features/shell/utils/platformConfig'

/**
 * Iframe login host (e.g. WebOnOne `/login`) passes allowlisted `parentOrigin`.
 * When set, success must postMessage the parent — never top-level redirect.
 */
export function useEmbedLoginMode() {
  const [searchParams] = useSearchParams()

  return useMemo(() => {
    const raw = searchParams.get(PLATFORM_EMBED_QUERY.PARENT_ORIGIN)
    const parentOrigin = raw && isAllowedParentOrigin(raw) ? raw : null
    const returnPath = searchParams.get('returnPath') ?? '/'

    return {
      isEmbed: Boolean(parentOrigin),
      parentOrigin,
      returnPath,
    }
  }, [searchParams])
}
