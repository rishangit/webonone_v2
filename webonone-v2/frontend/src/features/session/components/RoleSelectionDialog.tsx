import { useState } from 'react'
import { Button, CustomDialog, cn } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import { sessionRoleActions } from '@/features/session/store/sessionRoleSlice'
import { sessionRoleApi } from '@/features/session/services/sessionRoleApi'
import type { AssumableRoleOption } from '@/features/session/types/sessionRole.types'

function roleDescription(option: AssumableRoleOption): string {
  switch (option.role) {
    case 'super_admin':
      return 'Platform operator — Companies nav and system-wide Email access.'
    case 'company_admin':
      return option.companyName
        ? `Manage ${option.companyName} — company Email history and templates.`
        : 'Company administrator — company Email history and templates.'
    default:
      return 'Standard user — no Email menu in WebOnOne.'
  }
}

export function RoleSelectionDialog() {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const { dialogOpen, assumableRoles } = useAppSelector((s) => s.sessionRole)
  const [pendingRole, setPendingRole] = useState<AssumableRoleOption | null>(null)
  const [submitting, setSubmitting] = useState(false)

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

  return (
    <CustomDialog
      open={dialogOpen}
      onOpenChange={() => {
        /* selection required — ignore dismiss */
      }}
      title="Choose your role"
      description="Select how you want to use WebOnOne for this login session. Your choice stays active until you log out."
      sizeWidth="medium"
      sizeHeight="auto"
      footer={
        <Button type="button" disabled={!pendingRole || submitting} onClick={() => void handleContinue()}>
          Continue
        </Button>
      }
    >
      <ul className="flex flex-col gap-2">
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
                <span className="block font-medium text-foreground">{option.label}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {roleDescription(option)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </CustomDialog>
  )
}
