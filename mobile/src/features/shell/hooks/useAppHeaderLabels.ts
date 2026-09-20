import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppHeaderLabels } from '@webonone/mobile-ui'

export function useAppHeaderLabels(): AppHeaderLabels {
  const { t } = useTranslation('common')
  const { t: tShell } = useTranslation('shell')
  return useMemo(
    () => ({
      language: t('language'),
      english: t('english'),
      sinhala: t('sinhala'),
      profile: t('profile'),
      logout: t('logout'),
      userMenu: tShell('header.userMenu'),
      openNavigation: tShell('header.openNavigation'),
      closeNavigation: tShell('header.closeNavigation'),
    }),
    [t, tShell],
  )
}
