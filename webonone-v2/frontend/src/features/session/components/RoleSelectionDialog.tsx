import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AccountOptionRow, Button, CustomDialog } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import { performWebOnOneLogout } from '@/features/auth/utils/performWebOnOneLogout'
import { sessionRoleActions } from '@/features/session/store/sessionRoleSlice'
import { sessionRoleApi } from '@/features/session/services/sessionRoleApi'
import type { AssumableRoleOption } from '@/features/session/types/sessionRole.types'
import {
  findDefaultUser,
  findMatchingRole,
} from '@/features/session/utils/accountLabels'

export function RoleSelectionDialog() {
  const { t } = useTranslation('session')
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
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
      dispatch(
        sessionRoleActions.roleSelected({
          role: pendingRole.role,
          companyId: pendingRole.companyId,
          userId: user?.id,
        }),
      )
      dispatch(authActions.tokenRefreshed({ accessToken: result.accessToken, user: result.user }))
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

  const actionButtonClassName = 'h-10 w-full sm:w-auto'

  return (
    <CustomDialog
      open={dialogOpen}
      onOpenChange={handleOpenChange}
      title={t('chooseAccount.title')}
      description={
        isSettingsMode ? t('chooseAccount.descriptionSwitch') : t('chooseAccount.descriptionInitial')
      }
      sizeWidth="medium"
      sizeHeight="auto"
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          {isSettingsMode ? (
            <Button
              type="button"
              variant="outline"
              className={`${actionButtonClassName} border-[hsl(var(--glass-border))] text-foreground hover:bg-accent`}
              disabled={submitting}
              onClick={() => dispatch(sessionRoleActions.closeDialog())}
            >
              {t('common:cancel')}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className={`${actionButtonClassName} border-[hsl(var(--glass-border))] text-foreground hover:bg-accent`}
              disabled={submitting}
              onClick={performWebOnOneLogout}
            >
              {t('common:logout')}
            </Button>
          )}
          <Button
            type="button"
            className={actionButtonClassName}
            disabled={!pendingRole || submitting}
            onClick={() => void handleContinue()}
          >
            {t('common:continue')}
          </Button>
        </div>
      }
    >
      <ul className="flex max-h-[min(24rem,50vh)] flex-col gap-2 overflow-y-auto">
        {assumableRoles.map((option) => {
          const selected =
            pendingRole?.role === option.role && pendingRole?.companyId === option.companyId
          return (
            <li key={`${option.role}-${option.companyId ?? 'platform'}`}>
              <AccountOptionRow
                title={option.label}
                role={option.role}
                accountKind={option.accountKind}
                companyId={option.companyId}
                logoUrl={option.companyLogoUrl}
                logoAlt={option.companyName ?? option.label}
                selected={selected}
                onClick={() => setPendingRole(option)}
              />
            </li>
          )
        })}
      </ul>
    </CustomDialog>
  )
}
