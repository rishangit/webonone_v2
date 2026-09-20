import { useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Body, Button, Card, Muted, StatusTag, Subheading } from '@webonone/mobile-ui'
import { useSession } from '@/features/auth/SessionContext'
import { AccountSwitchDialog } from '@/features/settings/components/AccountSwitchDialog'
import {
  accountDescription,
  accountTitle,
  fallbackAccountLabel,
  findMatchingSessionRoleOption,
} from '@/features/settings/utils/accountLabels'

function roleTag(user: { role: string; accountKind?: 'staff' }): string {
  if (user.role === 'super_admin') return 'super_admin'
  if (user.role === 'company_admin') return 'company_admin'
  if (user.accountKind === 'staff') return 'staff'
  return 'member'
}

export function AccountSettingsPanel() {
  const { t } = useTranslation('settings')
  const { t: tSession } = useTranslation('session')
  const { user, roleOptions } = useSession()
  const [switchOpen, setSwitchOpen] = useState(false)

  if (!user) return null

  const matched = findMatchingSessionRoleOption(roleOptions, user.role, user.companyId ?? null)
  const label = matched
    ? accountTitle(matched, tSession)
    : fallbackAccountLabel(user.role, user.companyId ?? null, tSession)
  const description = matched ? accountDescription(matched, tSession) : tSession('descriptions.defaultUser')
  const canChange = roleOptions.length > 1

  return (
    <>
      <Card className="gap-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1 gap-1">
            <Subheading>{t('account.title')}</Subheading>
            <Muted>{t('account.description')}</Muted>
          </View>
          {canChange ? (
            <Button variant="outline" size="sm" onPress={() => setSwitchOpen(true)}>
              {t('account.change')}
            </Button>
          ) : null}
        </View>

        <View className="gap-2">
          <View className="flex-row flex-wrap items-center gap-2">
            <Body className="font-semibold">{label}</Body>
            <StatusTag role={roleTag(user)} />
          </View>
          <Muted>{description}</Muted>
          {!canChange ? <Muted>{t('account.onlyOneAvailable')}</Muted> : null}
        </View>
      </Card>

      <AccountSwitchDialog open={switchOpen} onOpenChange={setSwitchOpen} />
    </>
  )
}
