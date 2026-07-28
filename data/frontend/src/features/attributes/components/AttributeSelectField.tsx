import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  isPlatformPeerDialogCancelMessage,
  isPlatformPeerDialogResultMessage,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogRequest,
} from '@webonone/platform-embed'
import { Button, CustomDialog } from '@webonone/ui-kit'
import { AttributeFormDialog } from '@/features/attributes/components/AttributeFormDialog'
import {
  AttributePickerPanel,
  type AttributeSelectValue,
} from '@/features/attributes/components/AttributePickerPanel'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import type { Attribute } from '@/shared/types/data.types'

export type { AttributeSelectValue }

export const ATTRIBUTE_PICKER_DIALOG = {
  sizeWidth: 'small' as const,
  sizeHeight: 'large' as const,
}

export const ATTRIBUTE_CREATE_DIALOG = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'large' as const,
}

/** Shared chrome for standalone stacked + core-hosted peer attribute select. */
export const ATTRIBUTE_SELECT_PEER = {
  title: 'Add attributes',
  description: 'Choose one or more attributes to add.',
  submitLabel: 'Done',
  ...ATTRIBUTE_PICKER_DIALOG,
}

export const ATTRIBUTE_SELECT_EMBED_PATH = '/embed/dialogs/attributes/select'
export const ATTRIBUTE_CREATE_EMBED_PATH = '/embed/dialogs/attributes/create'
export const ATTRIBUTE_SELECT_SESSION_PREFIX = 'data:attribute-select:'

function createNestedRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `attribute-select-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export { createNestedRequestId }

function isAttributeUnitSummary(
  value: unknown,
): value is NonNullable<AttributeSelectValue['unit']> {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as { id?: unknown }).id === 'string' &&
    typeof (value as { name?: unknown }).name === 'string' &&
    typeof (value as { symbol?: unknown }).symbol === 'string'
  )
}

function isAttributeSelectValue(value: unknown): value is AttributeSelectValue {
  if (!value || typeof value !== 'object') return false
  const attribute = value as AttributeSelectValue
  const unitOk =
    attribute.unit === null || attribute.unit === undefined || isAttributeUnitSummary(attribute.unit)
  return (
    typeof attribute.id === 'string' &&
    typeof attribute.name === 'string' &&
    (attribute.valueType === 'number' || attribute.valueType === 'text') &&
    unitOk
  )
}

export function writeAttributeSelectSession(
  requestId: string,
  attributes: AttributeSelectValue[],
): void {
  try {
    sessionStorage.setItem(
      `${ATTRIBUTE_SELECT_SESSION_PREFIX}${requestId}`,
      JSON.stringify(attributes),
    )
  } catch {
    /* ignore quota / private mode */
  }
}

export function readAttributeSelectSession(requestId: string): AttributeSelectValue[] {
  try {
    const raw = sessionStorage.getItem(`${ATTRIBUTE_SELECT_SESSION_PREFIX}${requestId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isAttributeSelectValue)
  } catch {
    return []
  }
}

export function clearAttributeSelectSession(requestId: string): void {
  try {
    sessionStorage.removeItem(`${ATTRIBUTE_SELECT_SESSION_PREFIX}${requestId}`)
  } catch {
    /* ignore */
  }
}

export function toAttributeSelectValue(
  attribute: Attribute | AttributeSelectValue,
): AttributeSelectValue {
  return {
    id: attribute.id,
    name: attribute.name,
    valueType: attribute.valueType,
    unit: attribute.unit ?? null,
  }
}

function parseAttributesPayload(payload: unknown): AttributeSelectValue[] | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as { attributes?: unknown }
  if (!Array.isArray(record.attributes)) return null
  return record.attributes.filter(isAttributeSelectValue)
}

type AttributeSelectStackedDialogsProps = {
  pickerOpen: boolean
  /** Attributes already on the product — excluded from the add picker. */
  alreadySelectedAttributes: AttributeSelectValue[]
  onDone: (attributes: AttributeSelectValue[]) => void
  onClosePicker: () => void
  /** Base stack level for the picker (form dialog is 0 → use 1). */
  pickerStackLevel?: number
}

/**
 * Sibling stacked dialogs for adding attributes (dialog-windows SelectTag pattern).
 * When embedded in WebOnOne, opens a core-hosted peer dialog instead of local CustomDialog.
 * Render next to the outer form `CustomDialog`, never inside its children.
 * Done returns only newly chosen attributes — caller appends them to the product list.
 */
export function AttributeSelectStackedDialogs({
  pickerOpen,
  alreadySelectedAttributes,
  onDone,
  onClosePicker,
  pickerStackLevel = 1,
}: AttributeSelectStackedDialogsProps) {
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isHosted = Boolean(parentOrigin)

  const [pendingSelection, setPendingSelection] = useState<AttributeSelectValue[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [blockPickerDismiss, setBlockPickerDismiss] = useState(false)
  const createOpenRef = useRef(false)
  const blockPickerDismissRef = useRef(false)
  const blockTimerRef = useRef<number | null>(null)
  const wasPickerOpenRef = useRef(false)
  const peerRequestIdRef = useRef<string | null>(null)
  const alreadySelectedRef = useRef(alreadySelectedAttributes)
  const onDoneRef = useRef(onDone)
  const onClosePickerRef = useRef(onClosePicker)

  const excludedIds = useMemo(
    () => alreadySelectedAttributes.map((attribute) => attribute.id),
    [alreadySelectedAttributes],
  )

  useEffect(() => {
    alreadySelectedRef.current = alreadySelectedAttributes
  }, [alreadySelectedAttributes])

  useEffect(() => {
    onDoneRef.current = onDone
    onClosePickerRef.current = onClosePicker
  }, [onDone, onClosePicker])

  useEffect(() => {
    createOpenRef.current = createOpen
  }, [createOpen])

  // Add mode: each open starts with an empty pending selection.
  useEffect(() => {
    if (pickerOpen && !wasPickerOpenRef.current) {
      setPendingSelection([])
    } else if (!pickerOpen && wasPickerOpenRef.current) {
      setCreateOpen(false)
      createOpenRef.current = false
      setPendingSelection([])
      peerRequestIdRef.current = null
    }
    wasPickerOpenRef.current = pickerOpen
  }, [pickerOpen])

  useEffect(() => {
    return () => {
      if (blockTimerRef.current !== null) {
        window.clearTimeout(blockTimerRef.current)
      }
    }
  }, [])

  // Core-hosted peer dialog when embedded in WebOnOne.
  useEffect(() => {
    if (!parentOrigin || !pickerOpen) {
      peerRequestIdRef.current = null
      return
    }

    const requestId = createNestedRequestId()
    peerRequestIdRef.current = requestId
    writeAttributeSelectSession(requestId, alreadySelectedRef.current)
    sendPlatformPeerDialogRequest(parentOrigin, {
      requestId,
      path: ATTRIBUTE_SELECT_EMBED_PATH,
      title: ATTRIBUTE_SELECT_PEER.title,
      description: ATTRIBUTE_SELECT_PEER.description,
      submitLabel: ATTRIBUTE_SELECT_PEER.submitLabel,
      sizeWidth: ATTRIBUTE_SELECT_PEER.sizeWidth,
      sizeHeight: ATTRIBUTE_SELECT_PEER.sizeHeight,
    })
  }, [parentOrigin, pickerOpen])

  useEffect(() => {
    if (!parentOrigin) return

    function handleMessage(event: MessageEvent) {
      if (event.origin !== parentOrigin || event.source !== window.parent) {
        return
      }
      const requestId = peerRequestIdRef.current
      if (!requestId) return

      if (
        isPlatformPeerDialogResultMessage(event.data) &&
        event.data.requestId === requestId
      ) {
        peerRequestIdRef.current = null
        const attributes = parseAttributesPayload(event.data.payload) ?? []
        onDoneRef.current(attributes)
        onClosePickerRef.current()
        return
      }

      if (
        isPlatformPeerDialogCancelMessage(event.data) &&
        event.data.requestId === requestId
      ) {
        peerRequestIdRef.current = null
        onClosePickerRef.current()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [parentOrigin])

  const closeCreateDialog = useCallback(() => {
    setCreateOpen(false)
    createOpenRef.current = false
    blockPickerDismissRef.current = true
    setBlockPickerDismiss(true)
    if (blockTimerRef.current !== null) {
      window.clearTimeout(blockTimerRef.current)
    }
    blockTimerRef.current = window.setTimeout(() => {
      blockPickerDismissRef.current = false
      setBlockPickerDismiss(false)
      blockTimerRef.current = null
    }, 150)
  }, [])

  const closePickerDialog = useCallback(() => {
    setCreateOpen(false)
    createOpenRef.current = false
    onClosePicker()
  }, [onClosePicker])

  function handlePickerOpenChange(next: boolean) {
    if (next) return
    if (createOpenRef.current || createOpen) {
      closeCreateDialog()
      return
    }
    if (blockPickerDismissRef.current || blockPickerDismiss) {
      return
    }
    closePickerDialog()
  }

  function handleDone() {
    onDone(pendingSelection)
    closePickerDialog()
  }

  function openCreateDialog() {
    createOpenRef.current = true
    setCreateOpen(true)
  }

  function handleCreated(attribute?: Attribute) {
    if (attribute) {
      const selected = toAttributeSelectValue(attribute)
      if (excludedIds.includes(selected.id)) {
        closeCreateDialog()
        return
      }
      setPendingSelection((prev) => {
        if (prev.some((entry) => entry.id === selected.id)) {
          return prev.map((entry) => (entry.id === selected.id ? selected : entry))
        }
        return [...prev, selected]
      })
    }
    closeCreateDialog()
  }

  if (isHosted) {
    return null
  }

  return (
    <>
      <CustomDialog
        open={pickerOpen}
        onOpenChange={handlePickerOpenChange}
        title={ATTRIBUTE_SELECT_PEER.title}
        description={ATTRIBUTE_SELECT_PEER.description}
        sizeWidth={ATTRIBUTE_SELECT_PEER.sizeWidth}
        sizeHeight={ATTRIBUTE_SELECT_PEER.sizeHeight}
        noContentPadding
        disableContentScroll
        stackLevel={pickerStackLevel}
        nestedDismissGuard={createOpen || blockPickerDismiss}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
              onClick={(event) => {
                event.stopPropagation()
                closePickerDialog()
              }}
            >
              Cancel
            </Button>
            <Button type="button" className="h-10 px-4" onClick={handleDone}>
              {ATTRIBUTE_SELECT_PEER.submitLabel}
              {pendingSelection.length > 0 ? ` (${pendingSelection.length})` : ''}
            </Button>
          </>
        }
      >
        <div className="flex h-full min-h-0 flex-col">
          <AttributePickerPanel
            enabled={pickerOpen}
            multiple
            selectedAttributes={pendingSelection}
            onSelectionChange={setPendingSelection}
            onCreateRequest={openCreateDialog}
            excludedIds={excludedIds}
          />
        </div>
      </CustomDialog>

      <AttributeFormDialog
        open={createOpen}
        onOpenChange={(next) => {
          if (!next) closeCreateDialog()
        }}
        onSaved={handleCreated}
        stackLevel={pickerStackLevel + 1}
      />
    </>
  )
}
