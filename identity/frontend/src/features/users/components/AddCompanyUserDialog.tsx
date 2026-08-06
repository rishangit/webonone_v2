import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Save } from 'lucide-react'
import {
  isPlatformPeerDialogNestedCancelMessage,
  isPlatformPeerDialogNestedResultMessage,
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogBusy,
  sendPlatformPeerDialogComplete,
  sendPlatformPeerDialogDismiss,
  sendPlatformPeerDialogNestedRequest,
  usePlatformPeerDialogSubmit,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
import {
  Button,
  CustomDialog,
  USER_SELECTION_DIALOG_SIZE,
  UserSelectionDialog,
  type LoadUsersFn,
  type UserOption,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/shell/utils/platformConfig'
import {
  CreateCompanyUserForm,
  CREATE_COMPANY_USER_FORM_ID,
} from '@/features/users/components/CreateCompanyUserForm'
import type { CreateCompanyUserPayload } from '@/features/users/schemas/createCompanyUserSchemas'
import { createCompanyCustomer, listUsers } from '@/features/users/services/usersApi'
import { getSessionCompanyId } from '@/features/users/utils/currentRole'

const ADD_USER_DIALOG_PATH = '/embed/dialogs/users/add'
const CREATE_USER_DIALOG_PATH = '/embed/dialogs/users/create'

const CREATE_DIALOG_SIZE = {
  sizeWidth: 'small' as const,
  sizeHeight: 'auto' as const,
}

function createNestedRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `peer-nested-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function isUserOption(value: unknown): value is UserOption {
  if (!value || typeof value !== 'object') {
    return false
  }
  const user = value as Record<string, unknown>
  return typeof user.id === 'string' && typeof user.displayName === 'string'
}

function toUserOption(customer: {
  id: string
  displayName: string
  email: string | null
  avatarUrl?: string | null
}): UserOption {
  return {
    id: customer.id,
    displayName: customer.displayName,
    email: customer.email,
    avatarUrl: customer.avatarUrl ?? null,
  }
}

export type AddCompanyUserDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (user: UserOption) => void
  onCreated: (user: UserOption) => void
  chrome?: 'dialog' | 'embed-page'
}

export function AddCompanyUserDialog({
  open,
  onOpenChange,
  onSelect,
  onCreated,
  chrome = 'dialog',
}: AddCompanyUserDialogProps) {
  const { t } = useTranslation('users')
  const [searchParams] = useSearchParams()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const companyId = getSessionCompanyId(accessToken)
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const [pendingSelection, setPendingSelection] = useState<UserOption | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [blockOuterDismiss, setBlockOuterDismiss] = useState(false)
  const nestedRequestIdRef = useRef<string | null>(null)
  const createOpenRef = useRef(false)
  const blockOuterDismissRef = useRef(false)
  const blockTimerRef = useRef<number | null>(null)

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path: ADD_USER_DIALOG_PATH,
    title: t('addUserTitle'),
    description: t('addUserDescription'),
    submitLabel: t('done'),
    ...USER_SELECTION_DIALOG_SIZE,
    onResult: (payload) => {
      if (payload && typeof payload === 'object' && isUserOption(payload)) {
        const record = payload as UserOption & {
          alreadyAdded?: boolean
        }
        if (record.alreadyAdded) {
          onCreated(record)
        } else {
          onSelect(record)
        }
      }
      onOpenChange(false)
    },
    onCancel: () => onOpenChange(false),
  })

  const loadUsersForPicker: LoadUsersFn = useCallback(
    async ({ search, page, pageSize }) => {
      const result = await listUsers({
        search,
        role: null,
        page,
        pageSize,
        excludeCompanyId: companyId,
      })
      return {
        users: result.items.map(
          (user): UserOption => ({
            id: user.id,
            displayName: user.displayName,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
          }),
        ),
        hasMore: page * pageSize < result.total,
      }
    },
    [companyId],
  )

  useEffect(() => {
    createOpenRef.current = createOpen
  }, [createOpen])

  const closeCreateDialog = useCallback(() => {
    setCreateOpen(false)
    setCreateError(null)
    nestedRequestIdRef.current = null
    blockOuterDismissRef.current = true
    setBlockOuterDismiss(true)
    if (blockTimerRef.current !== null) {
      window.clearTimeout(blockTimerRef.current)
    }
    blockTimerRef.current = window.setTimeout(() => {
      blockOuterDismissRef.current = false
      setBlockOuterDismiss(false)
      blockTimerRef.current = null
    }, 150)
  }, [])

  const openCreateDialog = useCallback(() => {
    if (chrome === 'embed-page' && parentOrigin && dialogRequestId) {
      const nestedRequestId = createNestedRequestId()
      nestedRequestIdRef.current = nestedRequestId
      createOpenRef.current = true
      setCreateOpen(true)
      sendPlatformPeerDialogNestedRequest(parentOrigin, {
        parentRequestId: dialogRequestId,
        requestId: nestedRequestId,
        path: CREATE_USER_DIALOG_PATH,
        title: t('createUser'),
        description: t('createUserDescription'),
        submitLabel: t('createUser'),
        ...CREATE_DIALOG_SIZE,
      })
      return
    }
    createOpenRef.current = true
    setCreateOpen(true)
    setCreateError(null)
  }, [chrome, dialogRequestId, parentOrigin, t])

  useEffect(() => {
    return () => {
      if (blockTimerRef.current !== null) {
        window.clearTimeout(blockTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!open) {
      setCreateOpen(false)
      createOpenRef.current = false
      nestedRequestIdRef.current = null
      setCreateError(null)
      setPendingSelection(null)
      setCreating(false)
      setBlockOuterDismiss(false)
      blockOuterDismissRef.current = false
    }
  }, [open])

  useEffect(() => {
    if (chrome !== 'embed-page' || !parentOrigin || !dialogRequestId) {
      return
    }

    function handleMessage(event: MessageEvent) {
      if (event.origin !== parentOrigin || event.source !== window.parent) {
        return
      }
      const nestedId = nestedRequestIdRef.current
      if (!nestedId) {
        return
      }

      if (
        isPlatformPeerDialogNestedResultMessage(event.data) &&
        event.data.parentRequestId === dialogRequestId &&
        event.data.requestId === nestedId
      ) {
        nestedRequestIdRef.current = null
        setCreateOpen(false)
        createOpenRef.current = false
        const payload = event.data.payload
        if (payload && typeof payload === 'object' && isUserOption(payload)) {
          sendPlatformPeerDialogComplete(parentOrigin!, dialogRequestId!, {
            ...payload,
            alreadyAdded: true,
          })
        }
        return
      }

      if (
        isPlatformPeerDialogNestedCancelMessage(event.data) &&
        event.data.parentRequestId === dialogRequestId &&
        event.data.requestId === nestedId
      ) {
        closeCreateDialog()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [chrome, closeCreateDialog, dialogRequestId, parentOrigin])

  async function handleCreateSubmit(values: CreateCompanyUserPayload) {
    if (!companyId) {
      return
    }
    setCreating(true)
    setCreateError(null)
    try {
      const result = await createCompanyCustomer({
        companyId,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phoneNumber: values.phoneNumber,
      })
      const user = toUserOption(result)
      closeCreateDialog()
      onCreated(user)
      onOpenChange(false)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : t('failedToCreateUser'))
    } finally {
      setCreating(false)
    }
  }

  usePlatformPeerDialogSubmit({
    parentOrigin: chrome === 'embed-page' ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: () => {
      if (createOpenRef.current) {
        return
      }
      if (!pendingSelection || !parentOrigin || !dialogRequestId) {
        return
      }
      sendPlatformPeerDialogComplete(parentOrigin, dialogRequestId, pendingSelection)
    },
  })

  useEffect(() => {
    if (chrome !== 'embed-page' || !parentOrigin || !dialogRequestId) {
      return
    }
    if (createOpen) {
      sendPlatformPeerDialogBusy(parentOrigin, dialogRequestId, true, t('done'))
      return
    }
    sendPlatformPeerDialogBusy(
      parentOrigin,
      dialogRequestId,
      !pendingSelection,
      t('done'),
    )
  }, [chrome, createOpen, dialogRequestId, parentOrigin, pendingSelection])

  function handlePickerOpenChange(next: boolean) {
    if (!next && (createOpenRef.current || blockOuterDismissRef.current || blockOuterDismiss)) {
      if (createOpenRef.current || createOpen) {
        closeCreateDialog()
      }
      return
    }
    if (chrome === 'embed-page' && parentOrigin && dialogRequestId && !next) {
      sendPlatformPeerDialogDismiss(parentOrigin, dialogRequestId)
      return
    }
    onOpenChange(next)
  }

  if (chrome === 'embed-page') {
    if (!parentOrigin || !dialogRequestId) {
      return null
    }
    return (
      <UserSelectionDialog
        chrome="body"
        open
        onOpenChange={handlePickerOpenChange}
        onSelect={() => {
          /* Done is host footer via peer-dialog-submit */
        }}
        onPendingChange={setPendingSelection}
        onAddUser={openCreateDialog}
        loadUsers={loadUsersForPicker}
        emptyMessage={t('addUserEmpty')}
      />
    )
  }

  if (isHosted) {
    return null
  }

  return (
    <>
      <UserSelectionDialog
        open={open}
        onOpenChange={handlePickerOpenChange}
        onSelect={onSelect}
        loadUsers={loadUsersForPicker}
        title={t('addUserTitle')}
        description={t('addUserDescription')}
        emptyMessage={t('addUserEmpty')}
        onAddUser={openCreateDialog}
        nestedDismissGuard={createOpen || blockOuterDismiss}
      />
      <CustomDialog
        open={createOpen}
        onOpenChange={(next) => {
          if (!next) {
            closeCreateDialog()
          }
        }}
        title={t('createUser')}
        description={t('createUserDescription')}
        stackLevel={1}
        sizeWidth={CREATE_DIALOG_SIZE.sizeWidth}
        sizeHeight={CREATE_DIALOG_SIZE.sizeHeight}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              className="h-10 px-4"
              onClick={(event) => {
                event.stopPropagation()
                closeCreateDialog()
              }}
              disabled={creating}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              form={CREATE_COMPANY_USER_FORM_ID}
              className="h-10 px-4"
              disabled={creating}
            >
              <Save className="mr-2 h-4 w-4" aria-hidden />
              {creating ? t('creating') : t('createUser')}
            </Button>
          </>
        }
      >
        <CreateCompanyUserForm
          error={createError}
          disabled={creating}
          onSubmit={(values) => {
            void handleCreateSubmit(values)
          }}
        />
      </CustomDialog>
    </>
  )
}
