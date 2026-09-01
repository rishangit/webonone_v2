import { useState } from 'react'
import {
  PlatformPeerPanelEmbedPage,
  usePlatformPeerFilterPanelSubmit,
} from '@webonone/platform-embed'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { QueueStatusFilterFields } from '@/features/queue/components/QueueStatusFilterFields'
import type { QueueStatus } from '@/shared/types/sms.types'

export type SmsQueueStatusFilterDraft = {
  status: string
}

export function QueueFilterEmbedPage() {
  return (
    <PlatformPeerPanelEmbedPage<SmsQueueStatusFilterDraft>
      isAllowedParentOrigin={isAllowedParentOrigin}
    >
      {({ parentOrigin, requestId, initialDraft }) => (
        <QueueFilterEmbedBody
          parentOrigin={parentOrigin}
          requestId={requestId}
          initialDraft={initialDraft}
        />
      )}
    </PlatformPeerPanelEmbedPage>
  )
}

function QueueFilterEmbedBody({
  parentOrigin,
  requestId,
  initialDraft,
}: {
  parentOrigin: string
  requestId: string
  initialDraft: SmsQueueStatusFilterDraft | null
}) {
  const [status, setStatus] = useState<QueueStatus>(
    (initialDraft?.status as QueueStatus | undefined) ?? 'pending',
  )

  usePlatformPeerFilterPanelSubmit<SmsQueueStatusFilterDraft>({
    parentOrigin,
    requestId,
    getDraft: () => ({ status }),
    resetDraft: () => setStatus('pending'),
  })

  return (
    <div className="flex flex-col gap-4 p-4">
      <QueueStatusFilterFields value={status} onChange={setStatus} />
    </div>
  )
}
