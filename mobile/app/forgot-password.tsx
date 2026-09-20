import { ForgotPasswordScreen } from '@/features/auth/ForgotPasswordScreen'
import { GuestAuthLayout } from '@/features/auth/GuestAuthLayout'

export default function ForgotPassword() {
  return (
    <GuestAuthLayout>
      <ForgotPasswordScreen />
    </GuestAuthLayout>
  )
}
