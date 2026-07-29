import { useCallback, useEffect, useMemo, useState } from 'react'
import { Save, User } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  useToast,
  UserSelectionDialog,
  type UserOption,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import {
  nextTokenLabel,
  sessionTokensActions,
} from '@/features/calendar/store'
import {
  ensureCompanyCustomer,
  loadIdentityUsersForStaff,
} from '@/features/staff/services/identityUsersApi'

const OUTLINE_FOOTER =
  'h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent'

export type IssueTokenDialogProps = {
  open: boolean
  eventId: string
  occurrenceDate: string
  onOpenChange: (open: boolean) => void
}

export function IssueTokenDialog({
  open,
  eventId,
  occurrenceDate,
  onOpenChange,
}: IssueTokenDialogProps) {
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const activeCompanyId = useAppSelector((s) => s.sessionRole.activeCompanyId)
  const tokens = useAppSelector((s) => s.sessionTokens.items)
  const createStatus = useAppSelector((s) => s.sessionTokens.createStatus)
  const createError = useAppSelector((s) => s.sessionTokens.createError)
  const lastCreatedId = useAppSelector((s) => s.sessionTokens.lastCreatedId)

  const [user, setUser] = useState<UserOption | null>(null)
  const [userError, setUserError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [ensuringCustomer, setEnsuringCustomer] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)

  const tokenLabel = useMemo(() => nextTokenLabel(tokens), [tokens])
  const excludeUserIds = useMemo(
    () => new Set(tokens.map((item) => item.userId)),
    [tokens],
  )
  const saving = ensuringCustomer || createStatus === 'saving'

  useEffect(() => {
    if (!open) return
    setUser(null)
    setUserError(null)
    setSubmitError(null)
    setEnsuringCustomer(false)
    setPickerOpen(false)
    setPendingSubmit(false)
    dispatch(sessionTokensActions.resetCreateStatus())
  }, [open, dispatch])

  useEffect(() => {
    if (!pendingSubmit) return
    if (createStatus === 'idle' && lastCreatedId) {
      toast({ title: 'Token issued' })
      setPendingSubmit(false)
      onOpenChange(false)
      return
    }
    if (createStatus === 'error' && createError) {
      toast({
        title: 'Failed to issue token',
        description: createError,
        variant: 'destructive',
      })
      setSubmitError(createError)
      setPendingSubmit(false)
    }
  }, [
    pendingSubmit,
    createStatus,
    lastCreatedId,
    createError,
    toast,
    onOpenChange,
  ])

  const loadUsers = useCallback(
    async (params: Parameters<typeof loadIdentityUsersForStaff>[1]) => {
      if (!accessToken) throw new Error('Not signed in')
      return loadIdentityUsersForStaff(accessToken, params, excludeUserIds)
    },
    [accessToken, excludeUserIds],
  )

  async function handleIssue() {
    if (!user) {
      setUserError('Select a user to assign this token')
      return
    }
    if (!accessToken) {
      setSubmitError('Not signed in')
      return
    }
    if (!activeCompanyId) {
      setSubmitError('Company session required')
      return
    }

    setUserError(null)
    setSubmitError(null)
    setEnsuringCustomer(true)
    try {
      await ensureCompanyCustomer(accessToken, activeCompanyId, user.id)
      setPendingSubmit(true)
      dispatch(
        sessionTokensActions.createRequested({
          eventId,
          occurrenceDate,
          body: {
            user_id: user.id,
            user_display_name: user.displayName,
            user_email: user.email ?? null,
          },
        }),
      )
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to add company user'
      setSubmitError(message)
      toast({
        title: 'Failed to add company user',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setEnsuringCustomer(false)
    }
  }

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Issue token"
        description="Assign the next queue token to an Identity user."
        sizeWidth="medium"
        sizeHeight="auto"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              className={OUTLINE_FOOTER}
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={saving} onClick={() => void handleIssue()}>
              <Save className="mr-2 h-4 w-4" aria-hidden />
              {saving ? 'Issuing…' : 'Issue token'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {submitError ? (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Token number</p>
            <p className="text-2xl font-semibold tracking-wide text-foreground">
              {tokenLabel}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Assign an Identity user. New users are added to company customers.
            </p>
            {userError ? <p className="text-sm text-destructive">{userError}</p> : null}
            {user ? (
              <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{user.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email ?? 'No email'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={() => setPickerOpen(true)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setPickerOpen(true)}
              >
                <User className="mr-2 h-4 w-4" aria-hidden />
                Assign user
              </Button>
            )}
          </div>
        </div>
      </CustomDialog>

      <UserSelectionDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title="Select user"
        description="Choose an Identity user for this token."
        loadUsers={loadUsers}
        emptyMessage="No users found."
        chrome="dialog"
        onSelect={(selected) => {
          setUser(selected)
          setUserError(null)
          setPickerOpen(false)
        }}
      />
    </>
  )
}
