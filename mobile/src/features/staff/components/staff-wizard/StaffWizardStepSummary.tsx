import { View } from 'react-native'
import { Body, Muted, ReadOnlyField } from '@webonone/mobile-ui'
import { formatWorkingDaysSummary, type StaffWizardFormValues } from '@/features/staff/schemas/staffSchemas'

export function StaffWizardStepSummary({ values }: { values: StaffWizardFormValues }) {
  return (
    <View className="gap-4">
      <ReadOnlyField label="User" value={values.user?.displayName ?? '—'} />
      <ReadOnlyField label="Email" value={values.user?.email?.trim() || '—'} />
      <View className="gap-1">
        <Muted className="text-xs uppercase tracking-wide">Schedule</Muted>
        <Body>{formatWorkingDaysSummary(values.schedule)}</Body>
      </View>
    </View>
  )
}
