import { useTranslation } from 'react-i18next'
import { FormField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@webonone/mobile-ui'
import { LEAVE_STATUSES } from '@/features/staff/types/staffLeave.types'

export function StaffLeaveStatusFilterFields({
  value,
  onChange,
}: {
  value: string
  onChange: (status: string) => void
}) {
  const { t } = useTranslation('staff')

  return (
    <FormField label={t('leaves.filterStatus')}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={t('leaves.filterStatus')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('leaves.statusAll')}</SelectItem>
          {LEAVE_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {t(`leaves.statuses.${status}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  )
}
