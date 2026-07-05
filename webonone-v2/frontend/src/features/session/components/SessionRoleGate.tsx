import { useSessionRoleBootstrap } from '@/features/session/hooks/useSessionRoleBootstrap'
import { RoleSelectionDialog } from '@/features/session/components/RoleSelectionDialog'
import { useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'

export function SessionRoleGate({ children }: { children: React.ReactNode }) {
  useSessionRoleBootstrap()
  const { selectionComplete, loading, dialogOpen } = useAppSelector((s) => s.sessionRole)

  usePlatformLoading(!selectionComplete && loading && !dialogOpen ? 'Loading session…' : null)

  if (!selectionComplete) {
    return (
      <>
        {dialogOpen ? <RoleSelectionDialog /> : null}
        {children}
      </>
    )
  }

  return children
}
