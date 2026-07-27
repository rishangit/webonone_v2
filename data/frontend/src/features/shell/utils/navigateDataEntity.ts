import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  resolvePlatformEmbedParentOrigin,
  sendPlatformNavigate,
} from '@webonone/platform-embed'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'

export type DataEntityKey =
  | 'tags'
  | 'units'
  | 'attributes'
  | 'products'
  | 'services'
  | 'spaces'

/**
 * List/detail navigation that updates the WebOnOne shell URL when Data is
 * embedded (`/data/{entity}` / `/data/{entity}/:id`). Standalone keeps peer paths.
 */
export function useNavigateDataEntity() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)

  const goToList = useCallback(
    (entity: DataEntityKey) => {
      if (parentOrigin) {
        sendPlatformNavigate(parentOrigin, `/data/${entity}`)
        return
      }
      navigate({ pathname: `/${entity}`, search: searchParams.toString() })
    },
    [navigate, parentOrigin, searchParams],
  )

  const goToDetail = useCallback(
    (entity: DataEntityKey, id: string) => {
      if (parentOrigin) {
        sendPlatformNavigate(parentOrigin, `/data/${entity}/${id}`)
        return
      }
      navigate({ pathname: `/${entity}/${id}`, search: searchParams.toString() })
    },
    [navigate, parentOrigin, searchParams],
  )

  return { goToList, goToDetail, isEmbedded: Boolean(parentOrigin) }
}
