import { View } from 'react-native'
import { Muted } from '@webonone/mobile-ui'

export function EventWizardProgress({
  step,
  total,
  title,
}: {
  step: number
  total: number
  title: string
}) {
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
