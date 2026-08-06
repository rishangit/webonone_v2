import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
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
  t: (key: string, options?: Record<string, string>) => string,
): string {
  if (showPermissionPrompt && status !== 'ready') {
    return t('locationHintAllow')
  }
  switch (status) {
    case 'idle':
      return t('locationHintAllow')
    case 'pending':
      return t('locationWaiting')
    case 'ready':
      if (source === 'ip') {
        return placeLabel
          ? t('locationApprox', { label: placeLabel })
          : coords
            ? t('locationApprox', { label: formatUserCoords(coords) })
            : t('locationApproxReady')
      }
      return placeLabel ?? (coords ? formatUserCoords(coords) : t('locationReady'))
    case 'denied':
      return t('locationDenied')
    case 'unavailable':
      return t('locationUnavailable')
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
  const { t } = useTranslation('shell')
  const showOpenPrompt =
    !showPermissionPrompt &&
    (status === 'idle' ||
      status === 'denied' ||
      status === 'unavailable' ||
      source === 'ip' ||
      permissionDenied)

  const showRefresh = status === 'ready' && source === 'gps'

  const primary = statusMessage(status, coords, placeLabel, source, showPermissionPrompt, t)
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
          <span className="shrink-0 font-medium text-muted-foreground">{t('currentLocation')}</span>
          {showRefresh ? (
            <button
              type="button"
              className="inline-flex shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t('locationRefresh')}
              title={t('locationRefresh')}
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
                {t('locationPromptTitle')}
              </Button>
            ) : null}
            {trailing}
          </div>
        ) : null}
      </div>
    </div>
  )
}
