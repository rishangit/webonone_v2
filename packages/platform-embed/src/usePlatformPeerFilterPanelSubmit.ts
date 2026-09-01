import { useEffect, useRef } from 'react'
import {
  isPlatformPeerDialogSecondaryMessage,
  isPlatformPeerDialogSubmitMessage,
} from './types'
import { sendPlatformPeerDialogComplete } from './embedUrl'
import type { PeerFilterPanelResult } from './peerPanelDraft'

export type UsePlatformPeerFilterPanelSubmitOptions<T> = {
  parentOrigin: string | null | undefined
  requestId: string | null | undefined
  /** Current draft filter values. */
  getDraft: () => T
  /** Reset draft to defaults when Clear is clicked. */
  resetDraft: () => void
  /** Called after Apply before complete is sent (optional). */
  onApply?: () => void
}

/**
 * Embed panel routes: host Apply/Clear footer → read draft → complete with payload.
 */
export function usePlatformPeerFilterPanelSubmit<T>({
  parentOrigin,
  requestId,
  getDraft,
  resetDraft,
  onApply,
}: UsePlatformPeerFilterPanelSubmitOptions<T>): void {
  const getDraftRef = useRef(getDraft)
  const resetDraftRef = useRef(resetDraft)
  const onApplyRef = useRef(onApply)

  useEffect(() => {
    getDraftRef.current = getDraft
    resetDraftRef.current = resetDraft
    onApplyRef.current = onApply
  }, [getDraft, onApply, resetDraft])

  useEffect(() => {
    if (!parentOrigin || !requestId) {
      return
    }

    function handleMessage(event: MessageEvent) {
      if (event.origin !== parentOrigin || event.source !== window.parent) {
        return
      }
      if (
        isPlatformPeerDialogSubmitMessage(event.data) &&
        event.data.requestId === requestId
      ) {
        onApplyRef.current?.()
        const payload: PeerFilterPanelResult<T> = {
          action: 'apply',
          draft: getDraftRef.current(),
        }
        sendPlatformPeerDialogComplete(parentOrigin, requestId, payload)
        return
      }
      if (
        isPlatformPeerDialogSecondaryMessage(event.data) &&
        event.data.requestId === requestId
      ) {
        resetDraftRef.current()
        const payload: PeerFilterPanelResult<T> = {
          action: 'clear',
          draft: getDraftRef.current(),
        }
        sendPlatformPeerDialogComplete(parentOrigin, requestId, payload)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [parentOrigin, requestId])
}
