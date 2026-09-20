import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Muted } from '@webonone/mobile-ui'
import type { SessionTokenHistoryDetail } from '@/features/users/services/userHistoryApi'

export function TokenWorkflowProgress({
  progress,
}: {
  progress?: SessionTokenHistoryDetail['workflowProgress'] | null
}) {
  const { t } = useTranslation('users')

  if (!progress || progress.steps.length === 0) return null

  return (
    <View className="w-full flex-row flex-wrap items-center gap-x-1 gap-y-0.5 pt-1">
      {progress.steps.map((step, index) => {
        const label =
          step.kind === 'check_in'
            ? t('history.workflowCheckIn', { defaultValue: step.label })
            : step.kind === 'done'
              ? t('history.workflowDone', { defaultValue: step.label })
              : step.label
        const isCurrent = index === progress.currentIndex
        const isPast = index < progress.currentIndex
        return (
          <View key={step.id} className="flex-row items-center gap-x-1">
            {index > 0 ? <Muted className="text-xs">›</Muted> : null}
            <Text
              className={
                isCurrent
                  ? 'text-xs font-semibold text-primary'
                  : isPast
                    ? 'text-xs text-muted'
                    : 'text-xs text-muted/70'
              }
            >
              {label}
            </Text>
          </View>
        )
      })}
    </View>
  )
}
