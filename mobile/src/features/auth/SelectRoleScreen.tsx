import { useState } from 'react'
import { Platform, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  AccountOptionRow,
  Body,
  Button,
  Card,
  Heading,
  Muted,
  Subheading,
} from '@webonone/mobile-ui'
import { useSession } from './SessionContext'
import type { SessionRoleOption } from './sessionRoleApi'
import { accountTitle } from '@/features/settings/utils/accountLabels'

export function SelectRoleScreen() {
  const { t } = useTranslation('session')
  const { t: tc } = useTranslation('common')
  const { roleOptions, isBlocked, selectRole, logout } = useSession()
  const [pending, setPending] = useState<SessionRoleOption | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const stackedActions = Platform.OS === 'web'

  async function handleContinue() {
    if (!pending) return
    setSubmitting(true)
    setError(null)
    try {
      await selectRole(pending)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.failedToSetSessionRole', { status: '' }))
    } finally {
      setSubmitting(false)
    }
  }

  if (isBlocked) {
    return (
      <>
        <View className="gap-1">
          <Heading>{t('blockedTitle')}</Heading>
          <Muted>{t('blockedDefault')}</Muted>
        </View>
        <Card className="gap-3">
          <Body>{t('blockedHint')}</Body>
          <Button variant="outline" className={stackedActions ? 'w-full' : undefined} onPress={logout}>
            {tc('logout')}
          </Button>
        </Card>
      </>
    )
  }

  return (
    <>
      <View className="gap-1">
        <Heading>{t('chooseAccount.title')}</Heading>
        <Muted>{t('chooseAccount.descriptionInitial')}</Muted>
      </View>

      <Card className="gap-3">
        <Subheading>{t('accounts')}</Subheading>
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
        </View>
        {error ? <Body className="text-destructive">{error}</Body> : null}
        <View className="gap-2">
          <Button
            className={stackedActions ? 'w-full' : undefined}
            loading={submitting}
            disabled={!pending || submitting}
            onPress={handleContinue}
          >
            {tc('continue')}
          </Button>
          <Button
            variant="outline"
            className={stackedActions ? 'w-full' : undefined}
            disabled={submitting}
            onPress={logout}
          >
            {tc('logout')}
          </Button>
        </View>
      </Card>
    </>
  )
}
