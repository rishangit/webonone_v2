import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getPlatformEmbedParentOrigin,
  PLATFORM_EMBED_QUERY,
  sendPlatformPeerDialogBusy,
  sendPlatformPeerDialogComplete,
  usePlatformPeerDialogSubmit,
} from '@webonone/platform-embed'
import { Alert, AlertDescription } from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { SpacePickerPanel, type SpaceSelectValue } from '@/features/services/components/SpacePickerPanel'
import {
  clearSpaceSelectSession,
  readSpaceSelectSession,
  SPACE_SELECT_PEER,
} from '@/features/services/components/SpaceSelectField'

export function SpaceSelectEmbedPage() {
  const [searchParams] = useSearchParams()
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''

  const [pendingSelection, setPendingSelection] = useState<SpaceSelectValue[]>([])
  const [excludedIds, setExcludedIds] = useState<string[]>([])
  const pendingSelectionRef = useRef<SpaceSelectValue[]>([])

  useEffect(() => {
    if (!requestId) return
    const alreadySelected = readSpaceSelectSession(requestId)
    setExcludedIds(alreadySelected.map((space) => space.id))
    setPendingSelection([])
    pendingSelectionRef.current = []
    return () => clearSpaceSelectSession(requestId)
  }, [requestId])

  useEffect(() => {
    pendingSelectionRef.current = pendingSelection
  }, [pendingSelection])

  const onSubmit = useCallback(() => {
    if (!parentOrigin || !requestId) return
    sendPlatformPeerDialogComplete(parentOrigin, requestId, {
      spaces: pendingSelectionRef.current,
    })
  }, [parentOrigin, requestId])

  usePlatformPeerDialogSubmit({
    parentOrigin,
    requestId,
    onSubmit,
  })

  useEffect(() => {
    if (!parentOrigin || !requestId) return
    const label =
      pendingSelection.length > 0
        ? `${SPACE_SELECT_PEER.submitLabel} (${pendingSelection.length})`
        : SPACE_SELECT_PEER.submitLabel
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
      <SpacePickerPanel
        enabled
        selectedSpaces={pendingSelection}
        onSelectionChange={setPendingSelection}
        excludedIds={excludedIds}
      />
    </div>
  )
}
