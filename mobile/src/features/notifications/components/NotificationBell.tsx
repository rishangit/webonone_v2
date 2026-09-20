import { Text, View } from 'react-native'
import { Bell } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { HeaderIconButton, useThemedControlIconColor } from '@webonone/mobile-ui'
import { useNotifications } from '@/features/notifications/context/NotificationsContext'

type NotificationBellProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationBell({ open, onOpenChange }: NotificationBellProps) {
  const { t } = useTranslation('shell')
  const { unreadCount } = useNotifications()
  const iconColor = useThemedControlIconColor({ active: open })

  const badge =
    unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : null

  return (
    <View className="relative">
      <HeaderIconButton
        label={t('notifications.open')}
        onPress={() => onOpenChange(!open)}
        className={open ? 'border-primary' : undefined}
      >
        <Bell size={16} color={iconColor} strokeWidth={2} />
      </HeaderIconButton>
      {badge ? (
        <View className="absolute -right-1 -top-1 min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1">
          <Text className="text-[10px] font-semibold leading-none text-primary-foreground">
            {badge}
          </Text>
        </View>
      ) : null}
    </View>
  )
}
