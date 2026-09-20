import { ResetPasswordScreen } from '@/features/auth/ResetPasswordScreen'
import { GuestAuthLayout } from '@/features/auth/GuestAuthLayout'

export default function ResetPassword() {
  return (
    <GuestAuthLayout>
      <ResetPasswordScreen />
    </GuestAuthLayout>
  )
}
