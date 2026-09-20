import { View } from 'react-native'

export function CompanyWizardProgress({
  currentStep,
  totalSteps = 6,
}: {
  currentStep: number
  totalSteps?: number
}) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <View className="mx-auto w-1/2">
      <View className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <View className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
      </View>
    </View>
  )
}
