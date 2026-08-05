import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  resolvePlatformEmbedParentOrigin,
  sendPlatformNavigate,
} from '@webonone/platform-embed'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'

/** List/designer navigation that updates WebOnOne shell URL when Design is embedded. */
export function useNavigateDesign() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)

  const goToList = useCallback(() => {
    if (parentOrigin) {
      sendPlatformNavigate(parentOrigin, '/design/forms')
      return
    }
    navigate({ pathname: '/forms', search: searchParams.toString() })
  }, [navigate, parentOrigin, searchParams])

  const goToEdit = useCallback(
    (id: string) => {
      if (parentOrigin) {
        sendPlatformNavigate(parentOrigin, `/design/forms/${id}/edit`)
        return
      }
      navigate({ pathname: `/forms/${id}/edit`, search: searchParams.toString() })
    },
    [navigate, parentOrigin, searchParams],
  )

  const goToFill = useCallback(
    (id: string, query: Record<string, string>) => {
      const qs = new URLSearchParams(query).toString()
      const path = `/forms/${id}/fill${qs ? `?${qs}` : ''}`
      if (parentOrigin) {
        sendPlatformNavigate(parentOrigin, `/design${path}`)
        return
      }
      navigate(path)
    },
    [navigate, parentOrigin],
  )

  return { goToList, goToEdit, goToFill, isEmbedded: Boolean(parentOrigin) }
}
