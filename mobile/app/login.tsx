import { LoginScreen } from '@/features/auth/LoginScreen'
import { GuestAuthLayout } from '@/features/auth/GuestAuthLayout'

export default function Login() {
  return (
    <GuestAuthLayout>
      <LoginScreen />
    </GuestAuthLayout>
  )
}
