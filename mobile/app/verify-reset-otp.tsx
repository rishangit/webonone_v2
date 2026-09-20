import { VerifyResetOtpScreen } from '@/features/auth/VerifyResetOtpScreen'
import { GuestAuthLayout } from '@/features/auth/GuestAuthLayout'

export default function VerifyResetOtp() {
  return (
    <GuestAuthLayout>
      <VerifyResetOtpScreen />
    </GuestAuthLayout>
  )
}
