import { SelectRoleScreen } from '@/features/auth/SelectRoleScreen'
import { GuestAuthLayout } from '@/features/auth/GuestAuthLayout'

export default function SelectRole() {
  return (
    <GuestAuthLayout>
      <SelectRoleScreen />
    </GuestAuthLayout>
  )
}
