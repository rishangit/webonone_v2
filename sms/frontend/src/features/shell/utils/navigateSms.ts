import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  resolvePlatformEmbedParentOrigin,
  sendPlatformNavigate,
} from '@webonone/platform-embed'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'

/**
 * List/detail navigation that updates the WebOnOne shell URL when SMS is
 * embedded (`/sms/templates/:id`). Standalone keeps peer paths.
 */
export function useNavigateSms() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)

  const goToList = useCallback(() => {
    if (parentOrigin) {
      sendPlatformNavigate(parentOrigin, '/sms/templates')
      return
    }
    navigate({ pathname: '/templates', search: searchParams.toString() })
  }, [navigate, parentOrigin, searchParams])

  const goToDetail = useCallback(
    (id: string) => {
      if (parentOrigin) {
        sendPlatformNavigate(parentOrigin, `/sms/templates/${id}`)
        return
      }
      navigate({ pathname: `/templates/${id}`, search: searchParams.toString() })
    },
    [navigate, parentOrigin, searchParams],
  )

  const goToPreview = useCallback(
    (id: string) => {
      if (parentOrigin) {
        sendPlatformNavigate(parentOrigin, `/sms/templates/${id}/preview`)
        return
      }
      navigate({ pathname: `/templates/${id}/preview`, search: searchParams.toString() })
    },
    [navigate, parentOrigin, searchParams],
  )

  const goToVersions = useCallback(
    (id: string) => {
      if (parentOrigin) {
        sendPlatformNavigate(parentOrigin, `/sms/templates/${id}/versions`)
        return
      }
      navigate({ pathname: `/templates/${id}/versions`, search: searchParams.toString() })
    },
    [navigate, parentOrigin, searchParams],
  )

  return { goToList, goToDetail, goToPreview, goToVersions, isEmbedded: Boolean(parentOrigin) }
}
