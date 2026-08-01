import type { ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@webonone/ui-kit'
import {
  formatUserCoords,
  type UserLocationCoords,
  type UserLocationSource,
  type UserLocationStatus,
} from '@/features/website/hooks/useUserLocation'

type CurrentLocationBarProps = {
  coords: UserLocationCoords | null
  placeLabel: string | null
  status: UserLocationStatus
  source: UserLocationSource | null
  permissionDenied: boolean
  showPermissionPrompt: boolean
  onOpenPermissionPrompt: () => void
  onRetry: () => void
  /** Optional controls on the right of the location row (e.g. List / Map links). */
  trailing?: ReactNode
}

function statusMessage(
  status: UserLocationStatus,
  coords: UserLocationCoords | null,
  placeLabel: string | null,
  source: UserLocationSource | null,
  showPermissionPrompt: boolean,
): string {
  if (showPermissionPrompt && status !== 'ready') {
    return 'Allow location to sort results by distance.'
  }
  switch (status) {
    case 'idle':
      return 'Allow location to sort results by distance.'
    case 'pending':
      return 'Waiting for browser permission…'
    case 'ready':
      if (source === 'ip') {
        return placeLabel
          ? `Approximate: ${placeLabel}`
          : coords
            ? `Approximate: ${formatUserCoords(coords)}`
            : 'Approximate location ready'
      }
      return placeLabel ?? (coords ? formatUserCoords(coords) : 'Location ready')
    case 'denied':
      return 'Location blocked for this site. Open Allow location access? to see how to unlock it.'
    case 'unavailable':
      return 'Location unavailable in this browser.'
    default:
      return ''
  }
}

export function CurrentLocationBar({
  coords,
  placeLabel,
  status,
  source,
  permissionDenied,
  showPermissionPrompt,
  onOpenPermissionPrompt,
  onRetry,
  trailing,
}: CurrentLocationBarProps) {
  const showOpenPrompt =
    !showPermissionPrompt &&
    (status === 'idle' ||
      status === 'denied' ||
      status === 'unavailable' ||
      source === 'ip' ||
      permissionDenied)

  const showRefresh = status === 'ready' && source === 'gps'

  const primary = statusMessage(status, coords, placeLabel, source, showPermissionPrompt)
  const coordsLabel =
    status === 'ready' && coords && placeLabel && placeLabel !== formatUserCoords(coords)
      ? formatUserCoords(coords)
      : null
  const line =
    status === 'ready' && coordsLabel
      ? `${primary} · ${coordsLabel}`
      : primary

  const hasTrailing = showOpenPrompt || trailing != null

  return (
    <div className="bg-transparent py-1">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
        <p className="flex min-w-0 flex-1 items-center gap-1.5 text-sm text-foreground">
          <span className="shrink-0 font-medium text-muted-foreground">Your location</span>
          {showRefresh ? (
            <button
              type="button"
              className="inline-flex shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Refresh location"
              title="Refresh location"
              onClick={onRetry}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
          <span className="shrink-0 text-muted-foreground">·</span>
          <span className="min-w-0 truncate">{line}</span>
        </p>
        {hasTrailing ? (
          <div className="flex shrink-0 items-center gap-3">
            {showOpenPrompt ? (
              <Button type="button" size="sm" variant="default" onClick={onOpenPermissionPrompt}>
                Allow location access?
              </Button>
            ) : null}
            {trailing}
          </div>
        ) : null}
      </div>
    </div>
  )
}
