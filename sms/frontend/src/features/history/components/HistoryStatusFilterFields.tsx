import { useTranslation } from 'react-i18next'
import {
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'

type HistoryStatusFilterFieldsProps = {
  value: string
  onChange: (status: string) => void
}

function HistoryStatusFilterFields({ value, onChange }: HistoryStatusFilterFieldsProps) {
  const { t } = useTranslation('shell')
  const { t: tc } = useTranslation('common')

  return (
    <FormField label={tc('status')} htmlFor="history-status">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="history-status">
          <SelectValue placeholder={t('allStatuses')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{tc('all')}</SelectItem>
          <SelectItem value="sent">{t('statusSent')}</SelectItem>
          <SelectItem value="failed">{t('statusFailed')}</SelectItem>
        </SelectContent>
      </Select>
    </FormField>
  )
}

export { HistoryStatusFilterFields }
