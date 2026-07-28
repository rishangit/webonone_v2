import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
} from '@webonone/platform-embed'
import { Alert, AlertDescription } from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { AttributePickerPanel } from '@/features/attributes/components/AttributePickerPanel'
import {
  ATTRIBUTE_CREATE_DIALOG,
  ATTRIBUTE_CREATE_EMBED_PATH,
  ATTRIBUTE_SELECT_PEER,
  clearAttributeSelectSession,
  createNestedRequestId,
  readAttributeSelectSession,
  toAttributeSelectValue,
  type AttributeSelectValue,
} from '@/features/attributes/components/AttributeSelectField'
import type { Attribute } from '@/shared/types/data.types'

function isCreatedAttribute(value: unknown): value is Attribute | AttributeSelectValue {
  if (!value || typeof value !== 'object') return false
  const attribute = value as AttributeSelectValue
  return (
    typeof attribute.id === 'string' &&
    typeof attribute.name === 'string' &&
    (attribute.valueType === 'number' || attribute.valueType === 'text')
  )
}

/**
 * Peer-dialog nested body for adding attributes (host owns header/footer).
 * Session stores attributes already on the product (excluded from the list).
 * Done returns only newly chosen attributes — the product form appends them.
 */
export function AttributeSelectEmbedPage() {
  const [searchParams] = useSearchParams()
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''

  const [pendingSelection, setPendingSelection] = useState<AttributeSelectValue[]>([])
  const [excludedIds, setExcludedIds] = useState<string[]>([])
  const pendingSelectionRef = useRef<AttributeSelectValue[]>([])
  const nestedCreateRequestIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!requestId) return
    const alreadySelected = readAttributeSelectSession(requestId)
    setExcludedIds(alreadySelected.map((attribute) => attribute.id))
    setPendingSelection([])
    pendingSelectionRef.current = []
    return () => clearAttributeSelectSession(requestId)
  }, [requestId])

  useEffect(() => {
    pendingSelectionRef.current = pendingSelection
  }, [pendingSelection])

  const excludedIdSet = useMemo(() => new Set(excludedIds), [excludedIds])

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
      path: ATTRIBUTE_CREATE_EMBED_PATH,
      title: 'Create attribute',
      description: 'Create an attribute, then it is selected in the picker automatically.',
      submitLabel: 'Create attribute',
      ...ATTRIBUTE_CREATE_DIALOG,
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
        const attribute = isCreatedAttribute(event.data.payload) ? event.data.payload : null
        if (attribute) {
          const selected = toAttributeSelectValue(attribute)
          if (!excludedIdSet.has(selected.id)) {
            setPendingSelection((prev) =>
              prev.some((entry) => entry.id === selected.id) ? prev : [...prev, selected],
            )
          }
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
  }, [closeCreateRequest, excludedIdSet, parentOrigin, requestId])

  usePlatformPeerDialogSubmit({
    parentOrigin,
    requestId,
    onSubmit: () => {
      if (!parentOrigin || !requestId) return
      if (nestedCreateRequestIdRef.current) {
        return
      }
      sendPlatformPeerDialogComplete(parentOrigin, requestId, {
        attributes: pendingSelectionRef.current,
      })
    },
  })

  useEffect(() => {
    if (!parentOrigin || !requestId) return
    const label =
      pendingSelection.length > 0
        ? `${ATTRIBUTE_SELECT_PEER.submitLabel} (${pendingSelection.length})`
        : ATTRIBUTE_SELECT_PEER.submitLabel
    sendPlatformPeerDialogBusy(parentOrigin, requestId, false, label)
  }, [parentOrigin, pendingSelection.length, requestId])

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
      <AttributePickerPanel
        enabled
        multiple
        selectedAttributes={pendingSelection}
        onSelectionChange={setPendingSelection}
        onCreateRequest={openCreateDialog}
        excludedIds={excludedIds}
      />
    </div>
  )
}
