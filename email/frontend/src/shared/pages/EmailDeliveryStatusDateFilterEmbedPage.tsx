import { useState } from 'react'
import {
  PlatformPeerPanelEmbedPage,
  usePlatformPeerFilterPanelSubmit,
} from '@webonone/platform-embed'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { EmailDeliveryStatusDateFilterFields } from '@/shared/components/EmailDeliveryStatusDateFilterFields'
import type { EmailDeliveryStatusDateFilterDraft } from '@/shared/types/filterDrafts'
import { parseFilterDate, serializeFilterDate } from '@/shared/types/filterDrafts'

type EmailDeliveryStatusDateFilterEmbedPageProps = {
  idPrefix: string
}

export function EmailDeliveryStatusDateFilterEmbedPage({
  idPrefix,
}: EmailDeliveryStatusDateFilterEmbedPageProps) {
  return (
    <PlatformPeerPanelEmbedPage<EmailDeliveryStatusDateFilterDraft>
      isAllowedParentOrigin={isAllowedParentOrigin}
    >
      {({ parentOrigin, requestId, initialDraft }) => (
        <EmailDeliveryStatusDateFilterEmbedBody
          idPrefix={idPrefix}
          parentOrigin={parentOrigin}
          requestId={requestId}
          initialDraft={initialDraft}
        />
      )}
    </PlatformPeerPanelEmbedPage>
  )
}

function EmailDeliveryStatusDateFilterEmbedBody({
  idPrefix,
  parentOrigin,
  requestId,
  initialDraft,
}: {
  idPrefix: string
  parentOrigin: string
  requestId: string
  initialDraft: EmailDeliveryStatusDateFilterDraft | null
}) {
  const [status, setStatus] = useState(initialDraft?.status ?? 'all')
  const [from, setFrom] = useState<Date | undefined>(parseFilterDate(initialDraft?.from))
  const [to, setTo] = useState<Date | undefined>(parseFilterDate(initialDraft?.to))

  usePlatformPeerFilterPanelSubmit<EmailDeliveryStatusDateFilterDraft>({
    parentOrigin,
    requestId,
    getDraft: () => ({
      status,
      from: serializeFilterDate(from),
      to: serializeFilterDate(to),
    }),
    resetDraft: () => {
      setStatus('all')
      setFrom(undefined)
      setTo(undefined)
    },
  })

  return (
    <div className="flex flex-col gap-4 p-4">
      <EmailDeliveryStatusDateFilterFields
        idPrefix={idPrefix}
        status={status}
        onStatusChange={setStatus}
        from={from}
        onFromChange={setFrom}
        to={to}
        onToChange={setTo}
      />
    </div>
  )
}
