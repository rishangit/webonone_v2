import { useTranslation } from 'react-i18next'
import {
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'

export const ALL_ROLES_VALUE = '__all__'

type UsersRoleFilterFieldsProps = {
  value: string
  onChange: (role: string) => void
}

function UsersRoleFilterFields({ value, onChange }: UsersRoleFilterFieldsProps) {
  const { t } = useTranslation('users')

  return (
    <FormField label={t('roles.label')} htmlFor="users-role">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="users-role">
          <SelectValue placeholder={t('roles.all')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_ROLES_VALUE}>{t('roles.all')}</SelectItem>
          <SelectItem value="super_admin">{t('roles.super_admin')}</SelectItem>
          <SelectItem value="company_admin">{t('roles.company_admin')}</SelectItem>
          <SelectItem value="member">{t('roles.member')}</SelectItem>
        </SelectContent>
      </Select>
    </FormField>
  )
}

export { UsersRoleFilterFields }
