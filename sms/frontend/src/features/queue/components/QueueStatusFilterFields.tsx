import { useTranslation } from 'react-i18next'
import {
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'
import type { QueueStatus } from '@/shared/types/sms.types'

const STATUS_KEYS: QueueStatus[] = ['pending', 'processing', 'failed']

type QueueStatusFilterFieldsProps = {
  value: QueueStatus
  onChange: (status: QueueStatus) => void
}

function QueueStatusFilterFields({ value, onChange }: QueueStatusFilterFieldsProps) {
  const { t } = useTranslation('queue')
  const { t: tc } = useTranslation('common')

  return (
    <FormField label={tc('status')} htmlFor="queue-status">
      <Select value={value} onValueChange={(next) => onChange(next as QueueStatus)}>
        <SelectTrigger id="queue-status">
          <SelectValue placeholder={tc('status')} />
        </SelectTrigger>
        <SelectContent>
          {STATUS_KEYS.map((key) => (
            <SelectItem key={key} value={key}>
              {t(key)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  )
}

export { QueueStatusFilterFields }
