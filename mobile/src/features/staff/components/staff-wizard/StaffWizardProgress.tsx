import { View } from 'react-native'
import { Muted } from '@webonone/mobile-ui'
import type { StaffWizardStep } from '@/features/staff/schemas/staffSchemas'

const STEP_TITLES = ['User', 'Work schedule', 'Summary'] as const

export function StaffWizardProgress({
  step,
  total = 3,
}: {
  step: StaffWizardStep
  total?: number
}) {
  const title = STEP_TITLES[step - 1] ?? 'Step'
  const progress = step / total

  return (
    <View className="gap-2">
      <Muted className="text-center text-xs font-medium uppercase tracking-wide">
        Step {step} of {total} — {title}
      </Muted>
      <View className="mx-auto h-1.5 w-1/2 overflow-hidden rounded-full bg-border">
        <View className="h-full rounded-full bg-primary" style={{ width: `${progress * 100}%` }} />
      </View>
    </View>
  )
}
