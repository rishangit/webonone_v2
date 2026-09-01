import { useTranslation } from 'react-i18next'
import {
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'

type InvoiceStatusFilterFieldsProps = {
  value: string
  onChange: (status: string) => void
}

function InvoiceStatusFilterFields({ value, onChange }: InvoiceStatusFilterFieldsProps) {
  const { t } = useTranslation('invoices')
  const { t: tc } = useTranslation('common')

  return (
    <FormField label={tc('status')} htmlFor="invoice-status">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="invoice-status">
          <SelectValue placeholder={tc('status')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{tc('all')}</SelectItem>
          <SelectItem value="issued">{t('statusIssued')}</SelectItem>
          <SelectItem value="pending_verification">{t('statusPendingReview')}</SelectItem>
          <SelectItem value="paid">{t('statusPaid')}</SelectItem>
          <SelectItem value="overdue">{t('statusOverdue')}</SelectItem>
          <SelectItem value="void">{t('statusVoid')}</SelectItem>
        </SelectContent>
      </Select>
    </FormField>
  )
}

export { InvoiceStatusFilterFields }
