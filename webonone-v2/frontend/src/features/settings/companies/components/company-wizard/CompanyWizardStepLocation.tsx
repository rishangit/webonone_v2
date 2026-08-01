import { useCallback } from 'react'
import type { CompanyWizardFormValues } from '@/features/settings/basic/schemas/companySchemas'
import { CompanyMapPicker } from '../CompanyMapPicker'

interface CompanyWizardStepLocationProps {
  values: CompanyWizardFormValues
  isSubmitting: boolean
  onChange: (patch: Partial<CompanyWizardFormValues>) => void
}

export function CompanyWizardStepLocation({
  values,
  isSubmitting,
  onChange,
}: CompanyWizardStepLocationProps) {
  const handlePlaceSelected = useCallback(
    (place: {
      latitude: number
      longitude: number
      mapPlaceId: string | null
      mapFormattedAddress: string | null
      addressLine1?: string
      city?: string
      stateRegion?: string
      postalCode?: string
      country?: string
    }) => {
      onChange({
        latitude: place.latitude,
        longitude: place.longitude,
        mapPlaceId: place.mapPlaceId,
        mapFormattedAddress: place.mapFormattedAddress,
        // Prefill empty address fields from the place when the user pins a location
        ...(place.addressLine1 && !values.addressLine1.trim()
          ? { addressLine1: place.addressLine1 }
          : {}),
        ...(place.city && !values.city.trim() ? { city: place.city } : {}),
        ...(place.stateRegion && !values.stateRegion.trim()
          ? { stateRegion: place.stateRegion }
          : {}),
        ...(place.postalCode && !values.postalCode.trim()
          ? { postalCode: place.postalCode }
          : {}),
        ...(place.country && !values.country.trim() ? { country: place.country } : {}),
      })
    },
    [onChange, values.addressLine1, values.city, values.country, values.postalCode, values.stateRegion],
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <CompanyMapPicker
        mode="edit"
        latitude={values.latitude}
        longitude={values.longitude}
        fillHeight
        onPlaceSelected={isSubmitting ? undefined : handlePlaceSelected}
      />
    </div>
  )
}
