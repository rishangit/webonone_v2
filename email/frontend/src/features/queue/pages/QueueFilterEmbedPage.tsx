import { useState } from 'react'
import {
  PlatformPeerPanelEmbedPage,
  usePlatformPeerFilterPanelSubmit,
} from '@webonone/platform-embed'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { QueueStatusFilterFields } from '@/features/queue/components/QueueStatusFilterFields'
import type { EmailQueueStatusFilterDraft } from '@/shared/types/filterDrafts'
import type { QueueStatus } from '@/shared/types/email.types'

export function QueueFilterEmbedPage() {
  return (
    <PlatformPeerPanelEmbedPage<EmailQueueStatusFilterDraft>
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
  initialDraft: EmailQueueStatusFilterDraft | null
}) {
  const [status, setStatus] = useState<QueueStatus>(
    (initialDraft?.status as QueueStatus | undefined) ?? 'pending',
  )

  usePlatformPeerFilterPanelSubmit<EmailQueueStatusFilterDraft>({
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
