import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  isPlatformPeerDialogCancelMessage,
  isPlatformPeerDialogResultMessage,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogRequest,
} from '@webonone/platform-embed'
import { Button, CustomDialog } from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import {
  SpacePickerPanel,
  type SpaceSelectValue,
} from '@/features/services/components/SpacePickerPanel'

export type { SpaceSelectValue }

export const SPACE_SELECT_PEER = {
  title: 'Add spaces',
  description: 'Choose one or more existing spaces to add.',
  submitLabel: 'Done',
  sizeWidth: 'small' as const,
  sizeHeight: 'large' as const,
}

export const SPACE_SELECT_EMBED_PATH = '/embed/dialogs/services/spaces/select'
export const SPACE_SELECT_SESSION_PREFIX = 'data:service-space-select:'

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `space-select-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function isSpaceSelectValue(value: unknown): value is SpaceSelectValue {
  if (!value || typeof value !== 'object') return false
  const space = value as SpaceSelectValue
  return (
    typeof space.id === 'string' &&
    typeof space.name === 'string' &&
    (space.status === 'verified' || space.status === 'pending')
  )
}

export function writeSpaceSelectSession(requestId: string, spaces: SpaceSelectValue[]): void {
  try {
    sessionStorage.setItem(`${SPACE_SELECT_SESSION_PREFIX}${requestId}`, JSON.stringify(spaces))
  } catch {
    /* ignore quota / private mode */
  }
}

export function readSpaceSelectSession(requestId: string): SpaceSelectValue[] {
  try {
    const raw = sessionStorage.getItem(`${SPACE_SELECT_SESSION_PREFIX}${requestId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isSpaceSelectValue)
  } catch {
    return []
  }
}

export function clearSpaceSelectSession(requestId: string): void {
  try {
    sessionStorage.removeItem(`${SPACE_SELECT_SESSION_PREFIX}${requestId}`)
  } catch {
    /* ignore */
  }
}

function parseSpacesPayload(payload: unknown): SpaceSelectValue[] | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as { spaces?: unknown }
  if (!Array.isArray(record.spaces)) return null
  return record.spaces.filter(isSpaceSelectValue)
}

type SpaceSelectStackedDialogsProps = {
  pickerOpen: boolean
  alreadySelectedSpaces: SpaceSelectValue[]
  onDone: (spaces: SpaceSelectValue[]) => void
  onClosePicker: () => void
}

export function SpaceSelectStackedDialogs({
  pickerOpen,
  alreadySelectedSpaces,
  onDone,
  onClosePicker,
}: SpaceSelectStackedDialogsProps) {
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isHosted = Boolean(parentOrigin)

  const [pendingSelection, setPendingSelection] = useState<SpaceSelectValue[]>([])
  const wasPickerOpenRef = useRef(false)
  const peerRequestIdRef = useRef<string | null>(null)
  const alreadySelectedRef = useRef(alreadySelectedSpaces)
  const onDoneRef = useRef(onDone)
  const onClosePickerRef = useRef(onClosePicker)

  const excludedIds = useMemo(
    () => alreadySelectedSpaces.map((space) => space.id),
    [alreadySelectedSpaces],
  )

  useEffect(() => {
    alreadySelectedRef.current = alreadySelectedSpaces
  }, [alreadySelectedSpaces])

  useEffect(() => {
    onDoneRef.current = onDone
    onClosePickerRef.current = onClosePicker
  }, [onDone, onClosePicker])

  useEffect(() => {
    if (pickerOpen && !wasPickerOpenRef.current) {
      setPendingSelection([])
    } else if (!pickerOpen && wasPickerOpenRef.current) {
      setPendingSelection([])
      peerRequestIdRef.current = null
    }
    wasPickerOpenRef.current = pickerOpen
  }, [pickerOpen])

  useEffect(() => {
    if (!parentOrigin || !pickerOpen) {
      peerRequestIdRef.current = null
      return
    }

    const requestId = createRequestId()
    peerRequestIdRef.current = requestId
    writeSpaceSelectSession(requestId, alreadySelectedRef.current)
    sendPlatformPeerDialogRequest(parentOrigin, {
      requestId,
      path: SPACE_SELECT_EMBED_PATH,
      title: SPACE_SELECT_PEER.title,
      description: SPACE_SELECT_PEER.description,
      submitLabel: SPACE_SELECT_PEER.submitLabel,
      sizeWidth: SPACE_SELECT_PEER.sizeWidth,
      sizeHeight: SPACE_SELECT_PEER.sizeHeight,
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

      if (isPlatformPeerDialogResultMessage(event.data) && event.data.requestId === requestId) {
        peerRequestIdRef.current = null
        const spaces = parseSpacesPayload(event.data.payload) ?? []
        onDoneRef.current(spaces)
        onClosePickerRef.current()
        return
      }

      if (isPlatformPeerDialogCancelMessage(event.data) && event.data.requestId === requestId) {
        peerRequestIdRef.current = null
        onClosePickerRef.current()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [parentOrigin])

  function handleDone() {
    onDone(pendingSelection)
    onClosePicker()
  }

  if (isHosted) {
    return null
  }

  return (
    <CustomDialog
      open={pickerOpen}
      onOpenChange={(next) => {
        if (!next) onClosePicker()
      }}
      title={SPACE_SELECT_PEER.title}
      description={SPACE_SELECT_PEER.description}
      sizeWidth={SPACE_SELECT_PEER.sizeWidth}
      sizeHeight={SPACE_SELECT_PEER.sizeHeight}
      noContentPadding
      disableContentScroll
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
            onClick={(event) => {
              event.stopPropagation()
              onClosePicker()
            }}
          >
            Cancel
          </Button>
          <Button type="button" className="h-10 px-4" onClick={handleDone}>
            {SPACE_SELECT_PEER.submitLabel}
            {pendingSelection.length > 0 ? ` (${pendingSelection.length})` : ''}
          </Button>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <SpacePickerPanel
          enabled={pickerOpen}
          selectedSpaces={pendingSelection}
          onSelectionChange={setPendingSelection}
          excludedIds={excludedIds}
        />
      </div>
    </CustomDialog>
  )
}
