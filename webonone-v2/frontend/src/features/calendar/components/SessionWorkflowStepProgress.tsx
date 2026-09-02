import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@webonone/ui-kit'
import type { ServiceWorkflowItem } from '@/features/company-catalog/types/companyCatalog.types'
import { workflowStepLabel } from '@/features/calendar/utils/workflowStepLabels'

type SessionWorkflowStepProgressProps = {
  items: ServiceWorkflowItem[]
  selectedId: string
  onSelect: (stepId: string) => void
}

function scrollWorkflowStepIntoView(
  stepRefs: Map<string, HTMLButtonElement>,
  stepId: string,
) {
  const node = stepRefs.get(stepId)
  const nav = node?.closest('nav')
  if (!node || !nav) return
  const target = node.offsetLeft - (nav.clientWidth - node.offsetWidth) / 2
  const maxScroll = nav.scrollWidth - nav.clientWidth
  nav.scrollTo({
    left: Math.max(0, Math.min(target, maxScroll)),
    behavior: 'smooth',
  })
}

export function SessionWorkflowStepProgress({
  items,
  selectedId,
  onSelect,
}: SessionWorkflowStepProgressProps) {
  const { t } = useTranslation('calendar')
  const stepRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  if (items.length === 0) return null

  return (
    <nav
      aria-label={t('sessionDetail.workflow.ariaSteps')}
      className="overflow-x-auto scrollbar-themed"
    >
      <ol className="flex min-w-min items-start gap-0 px-1 pb-1">
        {items.map((item, index) => {
          const isSelected = item.id === selectedId
          const isLast = index === items.length - 1
          const label = workflowStepLabel(item, index, t)

          return (
            <li key={item.id} className="flex min-w-0 flex-1 items-start">
              <button
                ref={(node) => {
                  if (node) stepRefs.current.set(item.id, node)
                  else stepRefs.current.delete(item.id)
                }}
                type="button"
                aria-current={isSelected ? 'step' : undefined}
                onClick={() => {
                  onSelect(item.id)
                  scrollWorkflowStepIntoView(stepRefs.current, item.id)
                }}
                className="group flex min-w-[5.5rem] max-w-[9rem] flex-col items-center gap-2 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/40 text-muted-foreground group-hover:border-primary/60',
                  )}
                >
                  {index + 1}
                </span>
                <span
                  className={cn(
                    'line-clamp-2 w-full text-center text-xs leading-snug',
                    isSelected ? 'font-semibold text-primary' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </button>
              {!isLast ? (
                <span
                  className="mt-4 h-0.5 min-w-[1.5rem] flex-1 bg-border"
                  aria-hidden
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
