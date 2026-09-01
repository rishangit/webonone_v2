import { useTranslation } from 'react-i18next'
import {
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'

export type StatusFilterDraft = {
  status: string
}

type StatusFilterFieldsProps = {
  idPrefix: string
  value: string
  onChange: (status: string) => void
  verifiedLabel?: string
  unverifiedLabel?: string
}

function StatusFilterFields({
  idPrefix,
  value,
  onChange,
  verifiedLabel,
  unverifiedLabel,
}: StatusFilterFieldsProps) {
  const { t: tc } = useTranslation('common')

  return (
    <FormField label={tc('status')} htmlFor={`${idPrefix}-status`}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={`${idPrefix}-status`}>
          <SelectValue placeholder={tc('all')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{tc('all')}</SelectItem>
          <SelectItem value="verified">{verifiedLabel ?? tc('verified')}</SelectItem>
          <SelectItem value="pending">{unverifiedLabel ?? tc('unverified')}</SelectItem>
        </SelectContent>
      </Select>
    </FormField>
  )
}

export { StatusFilterFields }
