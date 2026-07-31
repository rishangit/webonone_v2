import { useLayoutEffect, useRef } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { IdentityLoginFrame } from '../components/IdentityLoginFrame'
import { authActions, clearWebOnOneAuthStorage } from '../store/authSlice'

const LOGIN_RETURN_PATH = '/'

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const clearedPromptRef = useRef(false)
  const promptLogin = searchParams.get('prompt') === 'login'

  // Satellite / Identity logout lands on `/login?prompt=login` — clear core JWT so
  // we do not bounce straight back into the authenticated shell.
  useLayoutEffect(() => {
    if (!promptLogin || clearedPromptRef.current) {
      return
    }
    clearedPromptRef.current = true
    clearWebOnOneAuthStorage()
    dispatch(authActions.logout())
  }, [dispatch, promptLogin])

  if (accessToken && !promptLogin) {
    return <Navigate to="/" replace />
  }

  // No PageShell — Identity iframe owns the auth chrome; avoid double headers.
  return (
    <div className="flex h-dvh min-h-0 w-full flex-col overflow-hidden">
      <IdentityLoginFrame returnPath={LOGIN_RETURN_PATH} />
    </div>
  )
}
