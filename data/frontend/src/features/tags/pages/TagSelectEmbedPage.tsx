import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getPlatformEmbedParentOrigin,
  isPlatformPeerDialogNestedCancelMessage,
  isPlatformPeerDialogNestedResultMessage,
  PLATFORM_EMBED_QUERY,
  sendPlatformPeerDialogBusy,
  sendPlatformPeerDialogComplete,
  sendPlatformPeerDialogNestedRequest,
  usePlatformPeerDialogSubmit,
  type DataTagPickerTag,
} from '@webonone/platform-embed'
import { Alert, AlertDescription } from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { TagPickerPanel } from '@/features/tags/components/TagPickerPanel'
import {
  clearTagSelectSession,
  createNestedRequestId,
  readTagSelectSession,
  TAG_CREATE_DIALOG,
  TAG_CREATE_EMBED_PATH,
} from '@/features/tags/components/TagSelectField'

function isCreatedTag(value: unknown): value is DataTagPickerTag {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as DataTagPickerTag).id === 'string' &&
    typeof (value as DataTagPickerTag).name === 'string' &&
    typeof (value as DataTagPickerTag).color === 'string'
  )
}

/**
 * Peer-dialog nested body for multi-select tags (host owns header/footer).
 * Opened from catalog form via `peer-dialog-nested-request`.
 * Add new tag opens a host sibling create dialog (nested-from-nested).
 */
export function TagSelectEmbedPage() {
  const [searchParams] = useSearchParams()
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''

  const [selectedTags, setSelectedTags] = useState<DataTagPickerTag[]>([])
  const selectedTagsRef = useRef<DataTagPickerTag[]>([])
  const nestedCreateRequestIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!requestId) return
    const initial = readTagSelectSession(requestId)
    setSelectedTags(initial)
    selectedTagsRef.current = initial
    return () => clearTagSelectSession(requestId)
  }, [requestId])

  useEffect(() => {
    selectedTagsRef.current = selectedTags
  }, [selectedTags])

  const closeCreateRequest = useCallback(() => {
    nestedCreateRequestIdRef.current = null
  }, [])

  const openCreateDialog = useCallback(() => {
    if (!parentOrigin || !requestId) return
    const nestedRequestId = createNestedRequestId()
    nestedCreateRequestIdRef.current = nestedRequestId
    sendPlatformPeerDialogNestedRequest(parentOrigin, {
      parentRequestId: requestId,
      requestId: nestedRequestId,
      path: TAG_CREATE_EMBED_PATH,
      title: 'Add new tag',
      description: 'Create a tag, then it is selected in the picker automatically.',
      submitLabel: 'Create',
      ...TAG_CREATE_DIALOG,
    })
  }, [parentOrigin, requestId])

  useEffect(() => {
    if (!parentOrigin || !requestId) return

    function handleMessage(event: MessageEvent) {
      if (event.origin !== parentOrigin || event.source !== window.parent) {
        return
      }
      const nestedId = nestedCreateRequestIdRef.current
      if (!nestedId) {
        return
      }

      if (
        isPlatformPeerDialogNestedResultMessage(event.data) &&
        event.data.parentRequestId === requestId &&
        event.data.requestId === nestedId
      ) {
        const tag = isCreatedTag(event.data.payload) ? event.data.payload : null
        if (tag) {
          setSelectedTags((prev) =>
            prev.some((entry) => entry.id === tag.id) ? prev : [...prev, tag],
          )
        }
        closeCreateRequest()
        return
      }

      if (
        isPlatformPeerDialogNestedCancelMessage(event.data) &&
        event.data.parentRequestId === requestId &&
        event.data.requestId === nestedId
      ) {
        closeCreateRequest()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [closeCreateRequest, parentOrigin, requestId])

  usePlatformPeerDialogSubmit({
    parentOrigin,
    requestId,
    onSubmit: () => {
      if (!parentOrigin || !requestId) return
      if (nestedCreateRequestIdRef.current) {
        return
      }
      sendPlatformPeerDialogComplete(parentOrigin, requestId, {
        tags: selectedTagsRef.current,
      })
    },
  })

  useEffect(() => {
    if (!parentOrigin || !requestId) return
    sendPlatformPeerDialogBusy(parentOrigin, requestId, false, 'Done')
  }, [parentOrigin, requestId])

  if (!parentOrigin || !requestId) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription>
            This page is available only for platform peer dialog embeds.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <TagPickerPanel
        enabled
        multiple
        selectedTags={selectedTags}
        onSelectionChange={setSelectedTags}
        onCreateRequest={openCreateDialog}
      />
    </div>
  )
}
