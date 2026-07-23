import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getPlatformEmbedParentOrigin,
  PLATFORM_EMBED_QUERY,
  sendPlatformPeerDialogBusy,
  sendPlatformPeerDialogComplete,
  usePlatformPeerDialogSubmit,
} from '@webonone/platform-embed'
import { Alert, AlertDescription } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/shell/utils/platformConfig'
import { CreateCompanyUserForm } from '@/features/users/components/CreateCompanyUserForm'
import type { CreateCompanyUserPayload } from '@/features/users/schemas/createCompanyUserSchemas'
import { createCompanyCustomer } from '@/features/users/services/usersApi'
import { getSessionCompanyId } from '@/features/users/utils/currentRole'

const CREATE_USER_SUBMIT_LABEL = 'Create user'

/**
 * Body-only create form for core-hosted nested sibling dialog
 * (SelectTag create pattern — host owns Cancel/Create footer).
 */
export function UserCreateEmbedPage() {
  const [searchParams] = useSearchParams()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const companyId = getSessionCompanyId(accessToken)
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  usePlatformPeerDialogSubmit({
    parentOrigin,
    requestId: requestId || null,
    onSubmit: () => {
      const form = document.getElementById('create-company-user-form')
      if (form instanceof HTMLFormElement) {
        form.requestSubmit()
      }
    },
  })

  useEffect(() => {
    if (!parentOrigin || !requestId) {
      return
    }
    sendPlatformPeerDialogBusy(
      parentOrigin,
      requestId,
      creating,
      creating ? 'Creating…' : CREATE_USER_SUBMIT_LABEL,
    )
  }, [creating, parentOrigin, requestId])

  async function handleSubmit(values: CreateCompanyUserPayload) {
    if (!companyId || !parentOrigin || !requestId) {
      return
    }
    setCreating(true)
    setError(null)
    try {
      const result = await createCompanyCustomer({
        companyId,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phoneNumber: values.phoneNumber,
      })
      sendPlatformPeerDialogComplete(parentOrigin, requestId, {
        id: result.id,
        displayName: result.displayName,
        email: result.email,
        avatarUrl: result.avatarUrl ?? null,
        alreadyAdded: true,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

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
    <div className="flex w-full flex-col gap-4 p-4 sm:p-6">
      <CreateCompanyUserForm
        error={error}
        disabled={creating}
        onSubmit={(values) => {
          void handleSubmit(values)
        }}
      />
    </div>
  )
}
