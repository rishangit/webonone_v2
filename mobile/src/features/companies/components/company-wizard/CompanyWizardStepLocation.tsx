import { View } from 'react-native'
import { Muted, TextField } from '@webonone/mobile-ui'
import type { CompanyWizardFormValues } from '@/features/companies/schemas/companySchemas'

function parseCoordinate(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export function CompanyWizardStepLocation({
  values,
  isSubmitting,
  onChange,
}: {
  values: CompanyWizardFormValues
  isSubmitting: boolean
  onChange: (patch: Partial<CompanyWizardFormValues>) => void
}) {
  return (
    <View className="gap-4">
      <Muted>
        Set a map pin for this company. Use the web app for interactive map picking, or enter
        coordinates manually below.
      </Muted>
      <TextField
        label="Map address"
        value={values.mapFormattedAddress ?? ''}
        onChangeText={(mapFormattedAddress) =>
          onChange({ mapFormattedAddress: mapFormattedAddress.trim() || null })
        }
        editable={!isSubmitting}
        placeholder="Formatted address from maps"
      />
      <TextField
        label="Latitude"
        value={values.latitude != null ? String(values.latitude) : ''}
        onChangeText={(text) => onChange({ latitude: parseCoordinate(text) })}
        editable={!isSubmitting}
        keyboardType="decimal-pad"
        placeholder="-6.9271"
      />
      <TextField
        label="Longitude"
        value={values.longitude != null ? String(values.longitude) : ''}
        onChangeText={(text) => onChange({ longitude: parseCoordinate(text) })}
        editable={!isSubmitting}
        keyboardType="decimal-pad"
        placeholder="79.8612"
      />
    </View>
  )
}
