import { useState } from 'react'
import {
  PlatformPeerPanelEmbedPage,
  usePlatformPeerFilterPanelSubmit,
} from '@webonone/platform-embed'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { HistoryStatusFilterFields } from '@/features/history/components/HistoryStatusFilterFields'

export type SmsHistoryStatusFilterDraft = {
  status: string
}

export function HistoryFilterEmbedPage() {
  return (
    <PlatformPeerPanelEmbedPage<SmsHistoryStatusFilterDraft>
      isAllowedParentOrigin={isAllowedParentOrigin}
    >
      {({ parentOrigin, requestId, initialDraft }) => (
        <HistoryFilterEmbedBody
          parentOrigin={parentOrigin}
          requestId={requestId}
          initialDraft={initialDraft}
        />
      )}
    </PlatformPeerPanelEmbedPage>
  )
}

function HistoryFilterEmbedBody({
  parentOrigin,
  requestId,
  initialDraft,
}: {
  parentOrigin: string
  requestId: string
  initialDraft: SmsHistoryStatusFilterDraft | null
}) {
  const [status, setStatus] = useState(initialDraft?.status ?? 'all')

  usePlatformPeerFilterPanelSubmit<SmsHistoryStatusFilterDraft>({
    parentOrigin,
    requestId,
    getDraft: () => ({ status }),
    resetDraft: () => setStatus('all'),
  })

  return (
    <div className="flex flex-col gap-4 p-4">
      <HistoryStatusFilterFields value={status} onChange={setStatus} />
    </div>
  )
}
