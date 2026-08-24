import { useTranslation } from 'react-i18next'

export type TokenWorkflowProgressValue = {
  steps: { id: string; label: string; kind: 'check_in' | 'space' | 'done' }[]
  currentIndex: number
  done: boolean
}

export function TokenWorkflowProgress({
  progress,
  ns = 'search',
}: {
  progress?: TokenWorkflowProgressValue | null
  ns?: string
}) {
  const { t } = useTranslation(ns)
  if (!progress || progress.steps.length === 0) return null

  return (
    <p className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs leading-snug">
      {progress.steps.map((step, index) => {
        const label =
          step.kind === 'check_in'
            ? t('workflowProgress.checkIn', { defaultValue: step.label })
            : step.kind === 'done'
              ? t('workflowProgress.done', { defaultValue: step.label })
              : step.label
        const isCurrent = index === progress.currentIndex
        const isPast = index < progress.currentIndex
        return (
          <span key={step.id} className="inline-flex items-center gap-x-1">
            {index > 0 ? (
              <span className="text-muted-foreground" aria-hidden>
                ›
              </span>
            ) : null}
            <span
              className={
                isCurrent
                  ? 'font-semibold text-primary'
                  : isPast
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/70'
              }
            >
              {label}
            </span>
          </span>
        )
      })}
    </p>
  )
}
