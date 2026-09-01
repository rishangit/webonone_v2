import { useState } from 'react'
import {
  PlatformPeerPanelEmbedPage,
  usePlatformPeerFilterPanelSubmit,
} from '@webonone/platform-embed'
import { isAllowedParentOrigin } from '@/features/shell/utils/platformConfig'
import {
  ALL_ROLES_VALUE,
  UsersRoleFilterFields,
} from '@/features/users/components/UsersRoleFilterFields'

export type UsersFilterDraft = {
  role: string
}

export function UsersFilterEmbedPage() {
  return (
    <PlatformPeerPanelEmbedPage<UsersFilterDraft>
      isAllowedParentOrigin={isAllowedParentOrigin}
    >
      {({ parentOrigin, requestId, initialDraft }) => (
        <UsersFilterEmbedBody
          parentOrigin={parentOrigin}
          requestId={requestId}
          initialDraft={initialDraft}
        />
      )}
    </PlatformPeerPanelEmbedPage>
  )
}

function UsersFilterEmbedBody({
  parentOrigin,
  requestId,
  initialDraft,
}: {
  parentOrigin: string
  requestId: string
  initialDraft: UsersFilterDraft | null
}) {
  const [role, setRole] = useState(initialDraft?.role ?? ALL_ROLES_VALUE)

  usePlatformPeerFilterPanelSubmit<UsersFilterDraft>({
    parentOrigin,
    requestId,
    getDraft: () => ({ role }),
    resetDraft: () => setRole(ALL_ROLES_VALUE),
  })

  return (
    <div className="flex flex-col gap-4 p-4">
      <UsersRoleFilterFields value={role} onChange={setRole} />
    </div>
  )
}
