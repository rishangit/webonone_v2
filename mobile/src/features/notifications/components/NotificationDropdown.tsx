import { useTranslation } from 'react-i18next'
import { AppShellDropdownPanel } from '@webonone/mobile-ui'
import { NotificationPanel } from '@/features/notifications/components/NotificationPanel'

type NotificationDropdownProps = {
  open: boolean
  onClose: () => void
}

export function NotificationDropdown({ open, onClose }: NotificationDropdownProps) {
  const { t } = useTranslation(['shell', 'common'])

  return (
    <AppShellDropdownPanel
      open={open}
      onClose={onClose}
      closeLabel={t('common:close')}
      accessibilityLabel={t('shell:notifications.title')}
    >
      <NotificationPanel onClose={onClose} />
    </AppShellDropdownPanel>
  )
}
