import { useTranslation } from 'react-i18next'
import { cn } from '@webonone/ui-kit'

export type TokenWorkflowStepKind = 'check_in' | 'space' | 'done'

export type TokenWorkflowProgressValue = {
  steps: { id: string; label: string; kind: TokenWorkflowStepKind }[]
  currentIndex: number
  done: boolean
}

type TokenWorkflowProgressProps = {
  progress?: TokenWorkflowProgressValue | null
  ns?: string
  layout?: 'inline' | 'footer'
}

export function TokenWorkflowProgress({
  progress,
  ns = 'calendar',
  layout = 'inline',
}: TokenWorkflowProgressProps) {
  const { t } = useTranslation(ns)
  if (!progress || progress.steps.length === 0) return null

  const stepper = (
    <p
      className={cn(
        'flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs leading-snug',
        layout === 'footer' && 'w-full justify-center sm:justify-start',
      )}
    >
      {progress.steps.map((step, index) => {
        const label =
          step.kind === 'check_in'
            ? t('workflowProgress.checkIn', { defaultValue: step.label })
            : step.kind === 'done'
              ? t('workflowProgress.done', { defaultValue: step.label })
              : step.label
        const isCurrent = progress.currentIndex >= 0 && index === progress.currentIndex
        const isPast = progress.currentIndex >= 0 && index < progress.currentIndex
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

  if (layout === 'footer') {
    return <div className="w-full pt-3">{stepper}</div>
  }

  return stepper
}
