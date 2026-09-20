import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import {
  Alert,
  AlertDescription,
  Body,
  Button,
  CustomDialog,
  SelectUser,
  UserSelectionDialog,
  type UserOption,
  useToast,
} from '@webonone/mobile-ui'
import { useSession } from '@/features/auth/SessionContext'
import { ensureCompanyCustomer, loadIdentityUsers } from '@/features/calendar/services/identityUsersApi'
import { nextTokenLabel, sessionTokensApi } from '@/features/calendar/services/sessionTokensApi'
import type { SessionToken } from '@/features/calendar/types/event.types'

type IssueTokenDialogProps = {
  open: boolean
  eventId: string
  occurrenceDate: string
  tokens: SessionToken[]
  onOpenChange: (open: boolean) => void
  onIssued: () => void
}

export function IssueTokenDialog({
  open,
  eventId,
  occurrenceDate,
  tokens,
  onOpenChange,
  onIssued,
}: IssueTokenDialogProps) {
  const { toast } = useToast()
  const { user: sessionUser } = useSession()
  const [selected, setSelected] = useState<UserOption | null>(null)
  const [userError, setUserError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerUsers, setPickerUsers] = useState<UserOption[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const tokenLabel = useMemo(() => nextTokenLabel(tokens), [tokens])
  const excludeUserIds = useMemo(() => new Set(tokens.map((item) => item.userId)), [tokens])

  useEffect(() => {
    if (!open) return
    setSelected(null)
    setUserError(null)
    setSubmitError(null)
    setSaving(false)
    setPickerOpen(false)
  }, [open])

  useEffect(() => {
    if (!pickerOpen) return
    let cancelled = false
    setLoadingUsers(true)
    void loadIdentityUsers({ pageSize: 100, excludeUserIds })
      .then((result) => {
        if (!cancelled) setPickerUsers(result.users)
      })
      .catch(() => {
        if (!cancelled) setPickerUsers([])
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false)
      })
    return () => {
      cancelled = true
    }
  }, [excludeUserIds, pickerOpen])

  async function handleIssue() {
    if (!selected) {
      setUserError('Select a user to assign this token')
      return
    }
    if (!sessionUser?.companyId) {
      setSubmitError('Company session required')
      return
    }
    setSaving(true)
    setSubmitError(null)
    try {
      await ensureCompanyCustomer(sessionUser.companyId, selected.id)
      await sessionTokensApi.create(eventId, occurrenceDate, {
        user_id: selected.id,
        user_display_name: selected.displayName,
        user_email: selected.email,
        user_avatar_url: selected.avatarUrl ?? null,
      })
      toast({ title: 'Token issued' })
      onIssued()
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to issue token'
      setSubmitError(message)
      toast({ title: 'Failed to issue token', description: message, variant: 'destructive' })
    } finally {
      setSaving(false)
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
        nestedDismissGuard={pickerOpen}
        footer={
          <View className="flex-row flex-wrap justify-end gap-2">
            <Button variant="outline" disabled={saving} onPress={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={saving} onPress={() => void handleIssue()}>
              {saving ? 'Issuing…' : 'Issue token'}
            </Button>
          </View>
        }
      >
        <View className="gap-4">
          {submitError ? (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}
          <Body>Token number {tokenLabel}</Body>
          {userError ? <Body className="text-destructive">{userError}</Body> : null}
          <SelectUser
            selectedUser={selected}
            placeholder="Assign user"
            onPress={() => setPickerOpen(true)}
          />
        </View>
      </CustomDialog>

      <UserSelectionDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        users={loadingUsers ? [] : pickerUsers}
        selectedId={selected?.id}
        title="Select user"
        onSelect={(next) => {
          setSelected(next)
          setUserError(null)
          setPickerOpen(false)
        }}
      />
    </>
  )
}
