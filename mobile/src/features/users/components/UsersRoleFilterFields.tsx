import { FormField, NativeSelect } from '@webonone/mobile-ui'

export const ALL_ROLES_VALUE = '__all__'

const ROLE_OPTIONS = [
  { value: ALL_ROLES_VALUE, label: 'All roles' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'company_admin', label: 'Company Admin' },
  { value: 'member', label: 'Member' },
]

type UsersRoleFilterFieldsProps = {
  value: string
  onChange: (role: string) => void
}

export function UsersRoleFilterFields({ value, onChange }: UsersRoleFilterFieldsProps) {
  return (
    <FormField label="Role">
      <NativeSelect
        value={value}
        onValueChange={onChange}
        options={ROLE_OPTIONS}
        allowEmpty={false}
      />
    </FormField>
  )
}
