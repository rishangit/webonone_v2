import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getPlatformEmbedParentOrigin,
  PLATFORM_EMBED_QUERY,
  sendPlatformPeerDialogBusy,
  sendPlatformPeerDialogComplete,
  usePlatformPeerDialogSubmit,
} from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  UserSelectionDialog,
  type LoadUsersFn,
  type UserOption,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { loadIdentityUsers } from '@/features/identity/services/identityUsersApi'

/**
 * Peer-dialog nested body for selecting an Identity user (host owns header/footer).
 */
export function UserSelectEmbedPage() {
  const [searchParams] = useSearchParams()
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''
  const accessToken = useAppSelector((s) => s.auth.accessToken)

  const [pendingSelection, setPendingSelection] = useState<UserOption | null>(null)
  const pendingRef = useRef<UserOption | null>(null)

  useEffect(() => {
    pendingRef.current = pendingSelection
  }, [pendingSelection])

  const loadUsers: LoadUsersFn = useCallback(
    async (params) => {
      if (!accessToken) {
        return { users: [], hasMore: false }
      }
      return loadIdentityUsers(accessToken, params)
    },
    [accessToken],
  )

  usePlatformPeerDialogSubmit({
    parentOrigin,
    requestId,
    onSubmit: () => {
      if (!parentOrigin || !requestId) return
      const selected = pendingRef.current
      if (!selected) return
      sendPlatformPeerDialogComplete(parentOrigin, requestId, selected)
    },
  })

  useEffect(() => {
    if (!parentOrigin || !requestId) return
    sendPlatformPeerDialogBusy(parentOrigin, requestId, !pendingSelection, 'Done')
  }, [parentOrigin, pendingSelection, requestId])

  if (!parentOrigin || !requestId) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription>
            This page is available only for platform peer dialog embeds.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <UserSelectionDialog
        chrome="body"
        open
        onOpenChange={() => {
          /* dismiss handled by host */
        }}
        onSelect={() => {
          /* selection committed via peer-dialog-submit */
        }}
        loadUsers={loadUsers}
        onPendingChange={setPendingSelection}
        title="Select supplier"
        description="Choose a user from Identity to set as the stock supplier."
      />
    </div>
  )
}
