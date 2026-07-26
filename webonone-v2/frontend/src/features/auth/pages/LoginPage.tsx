import { Navigate } from 'react-router-dom'
import { useAppSelector } from '@/app/store/hooks'
import { IdentityLoginFrame } from '../components/IdentityLoginFrame'

const LOGIN_RETURN_PATH = '/'

export function LoginPage() {
  const accessToken = useAppSelector((s) => s.auth.accessToken)

  if (accessToken) {
    return <Navigate to="/" replace />
  }

  // No PageShell — Identity iframe owns the auth chrome; avoid double headers.
  return (
    <div className="flex h-dvh min-h-0 w-full flex-col overflow-hidden">
      <IdentityLoginFrame returnPath={LOGIN_RETURN_PATH} />
    </div>
  )
}
