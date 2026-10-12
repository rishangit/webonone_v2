import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, SearchInput } from '@webonone/ui-kit'
import { CurrentLocationBar } from '@/features/website/components/CurrentLocationBar'
import { LocationPermissionDialog } from '@/features/website/components/LocationPermissionDialog'
import { NearbyHomeSection } from '@/features/website/components/NearbyHomeSection'
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

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-4 sm:px-8 sm:py-6">
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

        <form className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch" onSubmit={handleSubmit}>
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

        <NearbyHomeSection coords={coords} locationStatus={locationStatus} />
      </div>
    </div>
  )
}
