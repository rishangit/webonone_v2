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
} from '@webonone/platform-embed'
import { Alert, AlertDescription } from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { UnitPickerPanel } from '@/features/units/components/UnitPickerPanel'
import {
  clearUnitSelectSession,
  createNestedRequestId,
  readUnitSelectSession,
  toUnitSelectValue,
  UNIT_CREATE_DIALOG,
  UNIT_CREATE_EMBED_PATH,
  type UnitSelectValue,
} from '@/features/units/components/UnitSelectField'
import type { Unit } from '@/shared/types/data.types'

function isCreatedUnit(value: unknown): value is Unit | UnitSelectValue {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as UnitSelectValue).id === 'string' &&
    typeof (value as UnitSelectValue).name === 'string' &&
    typeof (value as UnitSelectValue).symbol === 'string'
  )
}

/**
 * Peer-dialog nested body for single-select units (host owns header/footer).
 * Opened from attribute form via `peer-dialog-nested-request`.
 * Add new unit opens a host sibling create dialog (nested-from-nested).
 */
export function UnitSelectEmbedPage() {
  const [searchParams] = useSearchParams()
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''

  const [selectedUnit, setSelectedUnit] = useState<UnitSelectValue | null>(null)
  const selectedUnitRef = useRef<UnitSelectValue | null>(null)
  const nestedCreateRequestIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!requestId) return
    const initial = readUnitSelectSession(requestId)
    setSelectedUnit(initial)
    selectedUnitRef.current = initial
    return () => clearUnitSelectSession(requestId)
  }, [requestId])

  useEffect(() => {
    selectedUnitRef.current = selectedUnit
  }, [selectedUnit])

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
      path: UNIT_CREATE_EMBED_PATH,
      title: 'Create unit',
      description: 'Create a unit, then it is selected in the picker automatically.',
      submitLabel: 'Create unit',
      ...UNIT_CREATE_DIALOG,
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
        const unit = isCreatedUnit(event.data.payload) ? event.data.payload : null
        if (unit) {
          setSelectedUnit(toUnitSelectValue(unit))
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
      const unit = selectedUnitRef.current
      sendPlatformPeerDialogComplete(parentOrigin, requestId, { unit })
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
      <UnitPickerPanel
        enabled
        selectedUnit={selectedUnit}
        onSelectionChange={setSelectedUnit}
        onCreateRequest={openCreateDialog}
      />
    </div>
  )
}
