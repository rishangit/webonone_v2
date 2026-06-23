import { useCallback } from 'react'
import {
  MEDIA_MESSAGE_TYPES,
  type MediaItemDto,
} from '@webonone/media-embed'

export function useMediaPostMessage(parentOrigin: string | null, scope: string | null) {
  const postSelect = useCallback(
    (items: MediaItemDto[]) => {
      if (!parentOrigin || !scope) return
      window.parent.postMessage(
        { type: MEDIA_MESSAGE_TYPES.SELECT, scope, items },
        parentOrigin,
      )
    },
    [parentOrigin, scope],
  )

  const postUploaded = useCallback(
    (items: MediaItemDto[]) => {
      if (!parentOrigin || !scope) return
      window.parent.postMessage(
        { type: MEDIA_MESSAGE_TYPES.UPLOADED, scope, items },
        parentOrigin,
      )
    },
    [parentOrigin, scope],
  )

  const postDeleted = useCallback(
    (ids: string[]) => {
      if (!parentOrigin || !scope) return
      window.parent.postMessage(
        { type: MEDIA_MESSAGE_TYPES.DELETED, scope, ids },
        parentOrigin,
      )
    },
    [parentOrigin, scope],
  )

  const postCancel = useCallback(() => {
    if (!parentOrigin) return
    window.parent.postMessage({ type: MEDIA_MESSAGE_TYPES.CANCEL }, parentOrigin)
  }, [parentOrigin])

  const postSelectionChange = useCallback(
    (items: MediaItemDto[]) => {
      if (!parentOrigin || !scope) return
      window.parent.postMessage(
        { type: MEDIA_MESSAGE_TYPES.SELECTION_CHANGE, scope, items },
        parentOrigin,
      )
    },
    [parentOrigin, scope],
  )

  return { postSelect, postUploaded, postDeleted, postCancel, postSelectionChange }
}
