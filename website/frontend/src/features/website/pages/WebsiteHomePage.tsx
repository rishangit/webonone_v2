import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, SearchInput } from '@webonone/ui-kit'
import { CurrentLocationBar } from '@/features/website/components/CurrentLocationBar'
import { LocationPermissionDialog } from '@/features/website/components/LocationPermissionDialog'
import { useUserLocation } from '@/features/website/hooks/useUserLocation'

export function WebsiteHomePage() {
  const { t } = useTranslation('home')
  const navigate = useNavigate()
  const {
    coords,
    placeLabel,
    status: locationStatus,
    source: locationSource,
    permissionDenied,
    showPermissionPrompt,
    requestLocation,
    openPermissionPrompt,
    dismissPermissionPrompt,
  } = useUserLocation()
  const [draftQuery, setDraftQuery] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = draftQuery.trim()
    if (!trimmed) return
    navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-background text-foreground">
      <LocationPermissionDialog
        open={showPermissionPrompt}
        blocked={permissionDenied}
        onAllow={requestLocation}
        onNotNow={dismissPermissionPrompt}
      />

      <section className="relative flex min-h-[min(70vh,36rem)] flex-1 flex-col overflow-hidden px-4 pb-16 pt-1 sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--accent-primary)/0.18),_transparent_55%),linear-gradient(160deg,_hsl(var(--background))_0%,_hsl(var(--muted)/0.45)_50%,_hsl(var(--background))_100%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(hsl(var(--foreground)/0.08)_1px,transparent_1px)] [background-size:18px_18px]"
        />

        <div className="relative z-10">
          <CurrentLocationBar
            coords={coords}
            placeLabel={placeLabel}
            status={locationStatus}
            source={locationSource}
            permissionDenied={permissionDenied}
            showPermissionPrompt={showPermissionPrompt}
            onOpenPermissionPrompt={openPermissionPrompt}
            onRetry={requestLocation}
          />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center text-center">
          <p className="mb-3 text-sm font-medium tracking-wide text-muted-foreground">{t('brand')}</p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t('headline')}
          </h1>
          <p className="mt-3 max-w-lg text-pretty text-sm text-muted-foreground sm:text-base">
            {t('subtitle')}
          </p>

          <form
            className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:items-stretch"
            onSubmit={handleSubmit}
          >
            <SearchInput
              className="flex-1"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              onClear={() => setDraftQuery('')}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchAria')}
            />
            <Button type="submit" disabled={!draftQuery.trim()}>
              {t('cta')}
            </Button>
          </form>
        </div>
      </section>
    </div>
  )
}
