import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  PlatformPeerPanelEmbedPage,
  usePlatformPeerFilterPanelSubmit,
} from '@webonone/platform-embed'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { StatusFilterFields, type StatusFilterDraft } from '@/shared/components/StatusFilterFields'

type StatusFilterEmbedPageProps = {
  idPrefix: string
  translationNs: string
}

function StatusFilterEmbedPage({ idPrefix, translationNs }: StatusFilterEmbedPageProps) {
  const { t } = useTranslation(translationNs)

  return (
    <PlatformPeerPanelEmbedPage<StatusFilterDraft>
      isAllowedParentOrigin={isAllowedParentOrigin}
    >
      {({ parentOrigin, requestId, initialDraft }) => (
        <StatusFilterEmbedBody
          idPrefix={idPrefix}
          parentOrigin={parentOrigin}
          requestId={requestId}
          initialDraft={initialDraft}
          verifiedLabel={t('verified')}
          unverifiedLabel={t('unverified')}
        />
      )}
    </PlatformPeerPanelEmbedPage>
  )
}

function StatusFilterEmbedBody({
  idPrefix,
  parentOrigin,
  requestId,
  initialDraft,
  verifiedLabel,
  unverifiedLabel,
}: {
  idPrefix: string
  parentOrigin: string
  requestId: string
  initialDraft: StatusFilterDraft | null
  verifiedLabel: string
  unverifiedLabel: string
}) {
  const [status, setStatus] = useState(initialDraft?.status ?? 'all')

  usePlatformPeerFilterPanelSubmit<StatusFilterDraft>({
    parentOrigin,
    requestId,
    getDraft: () => ({ status }),
    resetDraft: () => setStatus('all'),
  })

  return (
    <div className="flex flex-col gap-4 p-4">
      <StatusFilterFields
        idPrefix={idPrefix}
        value={status}
        onChange={setStatus}
        verifiedLabel={verifiedLabel}
        unverifiedLabel={unverifiedLabel}
      />
    </div>
  )
}

export { StatusFilterEmbedPage }
