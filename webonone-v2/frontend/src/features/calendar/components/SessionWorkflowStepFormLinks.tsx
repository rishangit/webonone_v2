import { useTranslation } from 'react-i18next'
import { Button } from '@webonone/ui-kit'
import type { ServiceWorkflowItem } from '@/features/company-catalog/types/companyCatalog.types'
import type { SessionToken } from '@/features/calendar/types/event.types'

type SessionWorkflowStepFormLinksProps = {
  item: ServiceWorkflowItem
  token: SessionToken
  submissionByTokenForm: Record<string, string>
  onFillForm: (token: SessionToken, formId: string) => void
  onViewForm: (token: SessionToken, formId: string, submissionId: string) => void
}

export function SessionWorkflowStepFormLinks({
  item,
  token,
  submissionByTokenForm,
  onFillForm,
  onViewForm,
}: SessionWorkflowStepFormLinksProps) {
  const { t } = useTranslation('calendar')

  if (!item.forms?.length) {
    return (
      <p className="text-sm text-muted-foreground">{t('sessionDetail.step.none')}</p>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {item.forms.map((form) => {
        const submissionId = submissionByTokenForm[`${token.id}:${form.id}`]
        const label = form.name ?? form.id
        if (submissionId) {
          return (
            <Button
              key={form.id}
              type="button"
              variant="link"
              className="h-auto justify-start px-0 text-sm"
              onClick={() => onViewForm(token, form.id, submissionId)}
            >
              {t('session.viewForm')}
              {item.forms.length > 1 ? ` · ${label}` : ''}
            </Button>
          )
        }
        return (
          <Button
            key={form.id}
            type="button"
            variant="link"
            className="h-auto justify-start px-0 text-sm"
            onClick={() => onFillForm(token, form.id)}
          >
            {t('session.fillForm')}
            {item.forms.length > 1 ? ` · ${label}` : ''}
          </Button>
        )
      })}
    </div>
  )
}
