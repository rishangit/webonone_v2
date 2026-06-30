import { useSessionRoleBootstrap } from '@/features/session/hooks/useSessionRoleBootstrap'
import { RoleSelectionDialog } from '@/features/session/components/RoleSelectionDialog'
import { useAppSelector } from '@/app/store/hooks'

export function SessionRoleGate({ children }: { children: React.ReactNode }) {
  useSessionRoleBootstrap()
  const { selectionComplete, loading, dialogOpen } = useAppSelector((s) => s.sessionRole)

  if (!selectionComplete) {
    return (
      <>
        {dialogOpen ? <RoleSelectionDialog /> : null}
        {loading || !dialogOpen ? (
          <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
            Loading…
          </div>
        ) : null}
      </>
    )
  }

  return children
}
