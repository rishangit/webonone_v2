import { useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  Input,
} from '@webonone/ui-kit'
import type { CompanyLocationCardValues } from '@/features/settings/basic/schemas/companySchemas'
import type { CompanyDetail } from '@/features/settings/basic/services/companyApi'
import { CompanyMapPicker } from './CompanyMapPicker'

function ReadOnlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm">{value?.trim() ? value : '—'}</p>
    </div>
  )
}

type CompanyLocationCardProps = {
  detail: CompanyDetail
  mode: 'view' | 'edit'
  values: CompanyLocationCardValues
  errors: Partial<Record<keyof CompanyLocationCardValues, string>>
  onChange: (values: CompanyLocationCardValues) => void
}

export function CompanyLocationCard({
  detail,
  mode,
  values,
  errors,
  onChange,
}: CompanyLocationCardProps) {
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
        ...values,
        latitude: place.latitude,
        longitude: place.longitude,
        mapPlaceId: place.mapPlaceId,
        mapFormattedAddress: place.mapFormattedAddress,
        ...(place.addressLine1 ? { addressLine1: place.addressLine1 } : {}),
        ...(place.city ? { city: place.city } : {}),
        ...(place.stateRegion ? { stateRegion: place.stateRegion } : {}),
        ...(place.postalCode ? { postalCode: place.postalCode } : {}),
        ...(place.country ? { country: place.country } : {}),
      })
    },
    [onChange, values],
  )

  const isEmpty =
    !detail.addressLine1 &&
    !detail.city &&
    !detail.country &&
    detail.latitude === null &&
    detail.longitude === null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Location information</CardTitle>
        <CardDescription>Map pin and postal / street address</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <CompanyMapPicker
          mode={mode}
          latitude={mode === 'edit' ? values.latitude : detail.latitude}
          longitude={mode === 'edit' ? values.longitude : detail.longitude}
          onPlaceSelected={mode === 'edit' ? handlePlaceSelected : undefined}
        />

        {mode === 'view' ? (
          <div className="space-y-4">
            {isEmpty ? (
              <p className="text-sm text-muted-foreground">
                No location details yet. Set a map pin and address to complete this section.
              </p>
            ) : null}
            {detail.mapFormattedAddress ? (
              <ReadOnlyField label="Map address" value={detail.mapFormattedAddress} />
            ) : null}
            <ReadOnlyField label="Address line 1" value={detail.addressLine1} />
            <ReadOnlyField label="Address line 2" value={detail.addressLine2} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ReadOnlyField label="City" value={detail.city} />
              <ReadOnlyField label="State / region" value={detail.stateRegion} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ReadOnlyField label="Postal code" value={detail.postalCode} />
              <ReadOnlyField label="Country" value={detail.country} />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <FormField
              label="Address line 1"
              htmlFor="company-location-line1"
              required
              error={errors.addressLine1}
            >
              <Input
                id="company-location-line1"
                value={values.addressLine1}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChange({ ...values, addressLine1: e.target.value })
                }
              />
            </FormField>
            <FormField label="Address line 2" htmlFor="company-location-line2" error={errors.addressLine2}>
              <Input
                id="company-location-line2"
                value={values.addressLine2}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChange({ ...values, addressLine2: e.target.value })
                }
              />
            </FormField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="City" htmlFor="company-location-city" required error={errors.city}>
                <Input
                  id="company-location-city"
                  value={values.city}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onChange({ ...values, city: e.target.value })
                  }
                />
              </FormField>
              <FormField label="State / region" htmlFor="company-location-state" error={errors.stateRegion}>
                <Input
                  id="company-location-state"
                  value={values.stateRegion}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onChange({ ...values, stateRegion: e.target.value })
                  }
                />
              </FormField>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Postal code" htmlFor="company-location-postal" error={errors.postalCode}>
                <Input
                  id="company-location-postal"
                  value={values.postalCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onChange({ ...values, postalCode: e.target.value })
                  }
                />
              </FormField>
              <FormField label="Country" htmlFor="company-location-country" required error={errors.country}>
                <Input
                  id="company-location-country"
                  value={values.country}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onChange({ ...values, country: e.target.value })
                  }
                />
              </FormField>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
