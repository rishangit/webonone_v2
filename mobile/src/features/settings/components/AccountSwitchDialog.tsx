import { useState } from 'react'
import { Platform, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { AccountOptionRow, Body, Button, CustomDialog } from '@webonone/mobile-ui'
import { useSession } from '@/features/auth/SessionContext'
import type { SessionRoleOption } from '@/features/auth/sessionRoleApi'
import { accountTitle } from '@/features/settings/utils/accountLabels'

export function AccountSwitchDialog({
  open,
  onOpenChange,
  onSwitched,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitched?: () => void
}) {
  const { t } = useTranslation('session')
  const { t: tc } = useTranslation('common')
  const { roleOptions, selectRole } = useSession()
  const [pending, setPending] = useState<SessionRoleOption | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const stackedActions = Platform.OS === 'web'

  async function handleSwitch() {
    if (!pending) return
    setBusy(true)
    setError(null)
    try {
      await selectRole(pending)
      onOpenChange(false)
      onSwitched?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.failedToSetSessionRole', { status: '' }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setPending(null)
          setError(null)
        }
        onOpenChange(next)
      }}
      title={t('chooseAccount.title')}
      description={t('chooseAccount.descriptionSwitch')}
      sizeWidth="medium"
      sizeHeight="auto"
      footer={
        <View className={stackedActions ? 'w-full gap-2' : 'flex-row flex-wrap justify-end gap-2'}>
          <Button
            variant="outline"
            className={stackedActions ? 'w-full' : undefined}
            disabled={busy}
            onPress={() => onOpenChange(false)}
          >
            {tc('cancel')}
          </Button>
          <Button
            className={stackedActions ? 'w-full' : undefined}
            loading={busy}
            disabled={!pending || busy}
            onPress={() => void handleSwitch()}
          >
            {tc('continue')}
          </Button>
        </View>
      }
    >
      <View className="gap-2">
        {roleOptions.map((option) => {
          const selected =
            pending?.role === option.role && (pending.companyId ?? null) === (option.companyId ?? null)
          return (
            <AccountOptionRow
              key={`${option.role}-${option.companyId ?? 'platform'}-${option.accountKind ?? 'default'}`}
              title={accountTitle(option, t)}
              role={option.role}
              accountKind={option.accountKind}
              companyId={option.companyId}
              logoUrl={option.companyLogoUrl}
              logoAlt={option.companyName ?? option.label}
              selected={selected}
              onPress={() => setPending(option)}
            />
          )
        })}
        {error ? <Body className="text-destructive">{error}</Body> : null}
      </View>
    </CustomDialog>
  )
}
