import { useTranslation } from 'react-i18next'
import {
  DatePicker,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'

type EmailDeliveryStatusDateFilterFieldsProps = {
  idPrefix: string
  status: string
  onStatusChange: (status: string) => void
  from?: Date
  onFromChange: (date?: Date) => void
  to?: Date
  onToChange: (date?: Date) => void
}

function EmailDeliveryStatusDateFilterFields({
  idPrefix,
  status,
  onStatusChange,
  from,
  onFromChange,
  to,
  onToChange,
}: EmailDeliveryStatusDateFilterFieldsProps) {
  const { t } = useTranslation('shell')
  const { t: tc } = useTranslation('common')

  return (
    <>
      <FormField label={tc('status')} htmlFor={`${idPrefix}-status`}>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger id={`${idPrefix}-status`}>
            <SelectValue placeholder={t('allStatuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tc('all')}</SelectItem>
            <SelectItem value="sent">{t('statusSent')}</SelectItem>
            <SelectItem value="failed">{t('statusFailed')}</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      <FormField label={t('fromDate')} htmlFor={`${idPrefix}-from`}>
        <DatePicker
          id={`${idPrefix}-from`}
          withIcon
          value={from}
          onChange={onFromChange}
          placeholder={t('startDate')}
        />
      </FormField>

      <FormField label={t('toDate')} htmlFor={`${idPrefix}-to`}>
        <DatePicker
          id={`${idPrefix}-to`}
          withIcon
          value={to}
          onChange={onToChange}
          placeholder={t('endDate')}
        />
      </FormField>
    </>
  )
}

export { EmailDeliveryStatusDateFilterFields }
