import { Outlet } from 'react-router-dom'
import { PlatformEmbedShell, usePlatformEmbedListener } from '@webonone/platform-embed'
import { Alert, AlertDescription, LoadingState } from '@webonone/ui-kit'
import { useEmbedThemeListener } from '@webonone/theme'
import { usePlatformPageLabel, usePlatformRouteLabel } from '@/features/auth/context/PlatformLoadingContext'
import { usePlatformSessionBootstrap } from '@/features/auth/hooks/usePlatformSessionBootstrap'
import { useRefreshDataRole } from '@/features/auth/hooks/useRefreshDataRole'
import { useAppSelector } from '@/app/store/hooks'

type PlatformEmbedLayoutProps = {
  parentOrigin: string
}

export function PlatformEmbedLayout({ parentOrigin }: PlatformEmbedLayoutProps) {
  useEmbedThemeListener(parentOrigin)

  const { accessToken } = useAppSelector((s) => s.auth)
  const { isBootstrapping, bootstrapError } = usePlatformSessionBootstrap()
  const roleReady = useRefreshDataRole(isBootstrapping)
  const pageLabel = usePlatformPageLabel()
  const routeLabel = usePlatformRouteLabel()

  usePlatformEmbedListener({
    parentOrigin,
    accessToken,
  })

  const sessionLoading = Boolean(accessToken) && !roleReady
  const overlayLabel = isBootstrapping || sessionLoading ? null : pageLabel ?? routeLabel

  return (
    <PlatformEmbedShell className="min-h-0 flex-1">
      <div className="platform-embed-outlet relative flex min-h-full w-full flex-col">
        <Outlet />
        {bootstrapError ? (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{bootstrapError}</AlertDescription>
          </Alert>
        ) : null}
        {overlayLabel ? (
          <LoadingState key="platform-loading" overlay overlayScope="content" label={overlayLabel} />
        ) : null}
      </div>
    </PlatformEmbedShell>
  )
}
