const PEER_PANEL_DRAFT_PREFIX = 'webonone:peer-panel-draft:'

function peerPanelDraftKey(requestId: string): string {
  return `${PEER_PANEL_DRAFT_PREFIX}${requestId}`
}

function writePeerPanelDraft(requestId: string, draft: unknown): void {
  try {
    sessionStorage.setItem(peerPanelDraftKey(requestId), JSON.stringify(draft))
  } catch {
    // ignore storage errors
  }
}

function readPeerPanelDraft<T>(requestId: string): T | null {
  try {
    const raw = sessionStorage.getItem(peerPanelDraftKey(requestId))
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function clearPeerPanelDraft(requestId: string): void {
  try {
    sessionStorage.removeItem(peerPanelDraftKey(requestId))
  } catch {
    // ignore storage errors
  }
}

export type PeerFilterPanelResult<T = unknown> = {
  action: 'apply' | 'clear'
  draft?: T
}

export { writePeerPanelDraft, readPeerPanelDraft, clearPeerPanelDraft }
