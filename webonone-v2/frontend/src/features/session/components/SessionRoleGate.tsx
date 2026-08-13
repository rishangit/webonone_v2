import { useSessionRoleBootstrap } from '@/features/session/hooks/useSessionRoleBootstrap'
import { RoleSelectionDialog } from '@/features/session/components/RoleSelectionDialog'
import { useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { useTranslation } from 'react-i18next'

export function SessionRoleGate({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation('shell')
  useSessionRoleBootstrap()
  const { selectionComplete, loading, dialogOpen } = useAppSelector((s) => s.sessionRole)

  usePlatformLoading(!selectionComplete && loading && !dialogOpen ? t('loading.session') : null)

  return (
    <>
      {dialogOpen ? <RoleSelectionDialog /> : null}
      {children}
    </>
  )
}
