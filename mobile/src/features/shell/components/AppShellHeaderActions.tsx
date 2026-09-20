import { Linking } from 'react-native'
import { CircleHelp, MessageCircle } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { HeaderIconButton, useThemedControlIconColor } from '@webonone/mobile-ui'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import { env } from '@/shared/config/env'

type AppShellHeaderActionsProps = {
  assistantOpen: boolean
  onAssistantOpenChange: (open: boolean) => void
  notificationsOpen: boolean
  onNotificationsOpenChange: (open: boolean) => void
}

export function AppShellHeaderActions({
  assistantOpen,
  onAssistantOpenChange,
  notificationsOpen,
  onNotificationsOpenChange,
}: AppShellHeaderActionsProps) {
  const { t } = useTranslation('shell')
  const iconColor = useThemedControlIconColor()
  const assistantIconColor = useThemedControlIconColor({ active: assistantOpen })

  return (
    <>
      <HeaderIconButton
        label={t('help')}
        onPress={() => void Linking.openURL(env.supportOrigin)}
      >
        <CircleHelp size={16} color={iconColor} strokeWidth={2} />
      </HeaderIconButton>
      <NotificationBell open={notificationsOpen} onOpenChange={onNotificationsOpenChange} />
      <HeaderIconButton
        label={t('assistant.open')}
        onPress={() => onAssistantOpenChange(!assistantOpen)}
        className={assistantOpen ? 'border-primary' : undefined}
      >
        <MessageCircle size={16} color={assistantIconColor} strokeWidth={2} />
      </HeaderIconButton>
    </>
  )
}
