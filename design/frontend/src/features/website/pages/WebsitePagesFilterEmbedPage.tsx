import { useState } from 'react'
import {
  PlatformPeerPanelEmbedPage,
  usePlatformPeerFilterPanelSubmit,
} from '@webonone/platform-embed'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { WebsitePagesStatusFilterFields } from '@/features/website/components/WebsitePagesStatusFilterFields'

export type WebsitePagesFilterDraft = {
  status: string
}

export function WebsitePagesFilterEmbedPage() {
  return (
    <PlatformPeerPanelEmbedPage<WebsitePagesFilterDraft>
      isAllowedParentOrigin={isAllowedParentOrigin}
    >
      {({ parentOrigin, requestId, initialDraft }) => (
        <WebsitePagesFilterEmbedBody
          parentOrigin={parentOrigin}
          requestId={requestId}
          initialDraft={initialDraft}
        />
      )}
    </PlatformPeerPanelEmbedPage>
  )
}

function WebsitePagesFilterEmbedBody({
  parentOrigin,
  requestId,
  initialDraft,
}: {
  parentOrigin: string
  requestId: string
  initialDraft: WebsitePagesFilterDraft | null
}) {
  const [status, setStatus] = useState(initialDraft?.status ?? 'all')

  usePlatformPeerFilterPanelSubmit<WebsitePagesFilterDraft>({
    parentOrigin,
    requestId,
    getDraft: () => ({ status }),
    resetDraft: () => setStatus('all'),
  })

  return (
    <div className="flex flex-col gap-4 p-4">
      <WebsitePagesStatusFilterFields value={status} onChange={setStatus} />
    </div>
  )
}
