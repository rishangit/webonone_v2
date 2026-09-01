import { useTranslation } from 'react-i18next'
import {
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'

type WebsitePagesStatusFilterFieldsProps = {
  value: string
  onChange: (status: string) => void
}

function WebsitePagesStatusFilterFields({ value, onChange }: WebsitePagesStatusFilterFieldsProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')

  return (
    <FormField label={tc('status')} htmlFor="website-pages-status">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="website-pages-status">
          <SelectValue placeholder={tc('all')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{tc('all')}</SelectItem>
          <SelectItem value="active">{t('active')}</SelectItem>
          <SelectItem value="inactive">{t('inactive')}</SelectItem>
        </SelectContent>
      </Select>
    </FormField>
  )
}

export { WebsitePagesStatusFilterFields }
