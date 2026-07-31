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
    (entity: DataEntityKey, id: string, search?: Record<string, string>) => {
      if (parentOrigin) {
        const path = `/data/${entity}/${id}`
        if (search && Object.keys(search).length > 0) {
          const query = new URLSearchParams(search).toString()
          sendPlatformNavigate(parentOrigin, `${path}?${query}`)
          return
        }
        sendPlatformNavigate(parentOrigin, path)
        return
      }
      const nextSearch = new URLSearchParams(searchParams)
      if (search) {
        for (const [key, value] of Object.entries(search)) {
          nextSearch.set(key, value)
        }
      }
      navigate({ pathname: `/${entity}/${id}`, search: nextSearch.toString() })
    },
    [navigate, parentOrigin, searchParams],
  )

  const goToVariantDetail = useCallback(
    (productId: string, variantId: string) => {
      if (parentOrigin) {
        sendPlatformNavigate(
          parentOrigin,
          `/data/products/${productId}/variants/${variantId}`,
        )
        return
      }
      navigate({
        pathname: `/products/${productId}/variants/${variantId}`,
        search: searchParams.toString(),
      })
    },
    [navigate, parentOrigin, searchParams],
  )

  return { goToList, goToDetail, goToVariantDetail, isEmbedded: Boolean(parentOrigin) }
}
