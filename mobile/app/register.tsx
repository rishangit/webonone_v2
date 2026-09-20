import { RegisterScreen } from '@/features/auth/RegisterScreen'
import { GuestAuthLayout } from '@/features/auth/GuestAuthLayout'

export default function Register() {
  return (
    <GuestAuthLayout>
      <RegisterScreen />
    </GuestAuthLayout>
  )
}
