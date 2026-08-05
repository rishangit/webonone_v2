import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  resolvePlatformEmbedParentOrigin,
  sendPlatformNavigate,
} from '@webonone/platform-embed'
import { isAllowedParentOrigin } from '@/features/shell/utils/platformConfig'

/**
 * List/detail navigation that updates the WebOnOne shell URL when Identity
 * Users is embedded (`/identity/users` / `/identity/users/:id`).
 *
 * When embedded, navigates the peer SPA first and marks the shell message as
 * `clientNavigated` so the host syncs the address bar without reloading the iframe.
 */
export function useNavigateIdentity() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)

  const goToUsersList = useCallback(() => {
    navigate({ pathname: '/users', search: searchParams.toString() })
    if (parentOrigin) {
      sendPlatformNavigate(parentOrigin, '/identity/users', { clientNavigated: true })
    }
  }, [navigate, parentOrigin, searchParams])

  const goToUserDetail = useCallback(
    (id: string, search?: Record<string, string>) => {
      const nextSearch = new URLSearchParams(searchParams)
      if (search) {
        for (const [key, value] of Object.entries(search)) {
          nextSearch.set(key, value)
        }
      } else {
        nextSearch.delete('tab')
      }

      navigate({ pathname: `/users/${id}`, search: nextSearch.toString() })

      if (parentOrigin) {
        const path = `/identity/users/${id}`
        const shellQuery =
          search && Object.keys(search).length > 0
            ? new URLSearchParams(search).toString()
            : ''
        sendPlatformNavigate(
          parentOrigin,
          shellQuery ? `${path}?${shellQuery}` : path,
          { clientNavigated: true },
        )
      }
    },
    [navigate, parentOrigin, searchParams],
  )

  /** Sync shell `?tab=` after local `useDetailTabParam` — no second peer navigate. */
  const syncShellUserTab = useCallback(
    (id: string, tab: 'overview' | 'history') => {
      if (!parentOrigin) {
        return
      }
      const path =
        tab === 'overview' ? `/identity/users/${id}` : `/identity/users/${id}?tab=${tab}`
      sendPlatformNavigate(parentOrigin, path, { clientNavigated: true })
    },
    [parentOrigin],
  )

  return {
    goToUsersList,
    goToUserDetail,
    syncShellUserTab,
    isEmbedded: Boolean(parentOrigin),
  }
}
