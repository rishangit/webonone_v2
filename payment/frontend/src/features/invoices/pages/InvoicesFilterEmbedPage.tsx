import { useState } from 'react'
import {
  PlatformPeerPanelEmbedPage,
  usePlatformPeerFilterPanelSubmit,
} from '@webonone/platform-embed'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { InvoiceStatusFilterFields } from '@/features/invoices/components/InvoiceStatusFilterFields'

export type InvoiceStatusFilterDraft = {
  status: string
}

export function InvoicesFilterEmbedPage() {
  return (
    <PlatformPeerPanelEmbedPage<InvoiceStatusFilterDraft>
      isAllowedParentOrigin={isAllowedParentOrigin}
    >
      {({ parentOrigin, requestId, initialDraft }) => (
        <InvoicesFilterEmbedBody
          parentOrigin={parentOrigin}
          requestId={requestId}
          initialDraft={initialDraft}
        />
      )}
    </PlatformPeerPanelEmbedPage>
  )
}

function InvoicesFilterEmbedBody({
  parentOrigin,
  requestId,
  initialDraft,
}: {
  parentOrigin: string
  requestId: string
  initialDraft: InvoiceStatusFilterDraft | null
}) {
  const [status, setStatus] = useState(initialDraft?.status ?? 'all')

  usePlatformPeerFilterPanelSubmit<InvoiceStatusFilterDraft>({
    parentOrigin,
    requestId,
    getDraft: () => ({ status }),
    resetDraft: () => setStatus('all'),
  })

  return (
    <div className="flex flex-col gap-4 p-4">
      <InvoiceStatusFilterFields value={status} onChange={setStatus} />
    </div>
  )
}
