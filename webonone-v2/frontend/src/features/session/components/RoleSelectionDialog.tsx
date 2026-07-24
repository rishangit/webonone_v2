import { useEffect, useState } from 'react'
import { Button, CustomDialog, cn, isStatusTagVariant, StatusTag } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import { sessionRoleActions } from '@/features/session/store/sessionRoleSlice'
import { sessionRoleApi } from '@/features/session/services/sessionRoleApi'
import type { AssumableRoleOption } from '@/features/session/types/sessionRole.types'
import {
  accountDescription,
  findDefaultUser,
  findMatchingRole,
} from '@/features/session/utils/accountLabels'

export function RoleSelectionDialog() {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const { dialogOpen, dialogMode, assumableRoles, activeRole, activeCompanyId } = useAppSelector(
    (s) => s.sessionRole,
  )
  const [pendingRole, setPendingRole] = useState<AssumableRoleOption | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isSettingsMode = dialogMode === 'settings'

  useEffect(() => {
    if (!dialogOpen) {
      setPendingRole(null)
      setSubmitting(false)
      return
    }

    setPendingRole((current) => {
      if (current) {
        return current
      }
      if (isSettingsMode) {
        return (
          findMatchingRole(assumableRoles, activeRole, activeCompanyId) ??
          findDefaultUser(assumableRoles)
        )
      }
      return findDefaultUser(assumableRoles)
    })
  }, [dialogOpen, dialogMode, isSettingsMode, assumableRoles, activeRole, activeCompanyId])

  async function handleContinue() {
    if (!pendingRole || !accessToken) return
    setSubmitting(true)
    try {
      const result = await sessionRoleApi.reissueSessionRole(
        accessToken,
        pendingRole.role,
        pendingRole.companyId,
      )
      dispatch(authActions.tokenRefreshed({ accessToken: result.accessToken, user: result.user }))
      dispatch(
        sessionRoleActions.roleSelected({
          role: pendingRole.role,
          companyId: pendingRole.companyId,
        }),
      )
    } catch {
      setSubmitting(false)
    }
  }

  function handleOpenChange(open: boolean) {
    if (open) {
      return
    }
    if (isSettingsMode) {
      dispatch(sessionRoleActions.closeDialog())
    }
  }

  return (
    <CustomDialog
      open={dialogOpen}
      onOpenChange={handleOpenChange}
      title="Choose account"
      description={
        isSettingsMode
          ? 'Switch which account to use for this WebOnOne session.'
          : 'Select which account to use for this WebOnOne session. Your choice stays active until you log out.'
      }
      sizeWidth="medium"
      sizeHeight="auto"
      footer={
        <>
          {isSettingsMode ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
              disabled={submitting}
              onClick={() => dispatch(sessionRoleActions.closeDialog())}
            >
              Cancel
            </Button>
          ) : null}
          <Button
            type="button"
            className="h-10"
            disabled={!pendingRole || submitting}
            onClick={() => void handleContinue()}
          >
            Continue
          </Button>
        </>
      }
    >
      <ul className="flex max-h-[min(24rem,50vh)] flex-col gap-2 overflow-y-auto">
        {assumableRoles.map((option) => {
          const selected =
            pendingRole?.role === option.role && pendingRole.companyId === option.companyId
          return (
            <li key={`${option.role}-${option.companyId ?? 'platform'}`}>
              <button
                type="button"
                className={cn(
                  'w-full rounded-lg border px-4 py-3 text-left transition-colors',
                  selected
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-glass-bg hover:border-primary/50',
                )}
                onClick={() => setPendingRole(option)}
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{option.label}</span>
                  {isStatusTagVariant(option.role) ? (
                    <StatusTag variant={option.role} className="shrink-0" />
                  ) : (
                    <span className="text-xs text-muted-foreground">{option.role}</span>
                  )}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {accountDescription(option)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </CustomDialog>
  )
}
