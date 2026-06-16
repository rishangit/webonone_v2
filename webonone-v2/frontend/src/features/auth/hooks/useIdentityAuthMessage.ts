import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/app/store/hooks'
import { authActions } from '../store/authSlice'
import type { AuthPostMessage } from '../types/auth.types'

const IDENTITY_ORIGIN =
  import.meta.env.VITE_IDENTITY_ORIGIN ?? 'http://localhost:3001'

export function useIdentityAuthMessage(returnPath: string = '/') {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    function handleMessage(event: MessageEvent<AuthPostMessage>) {
      if (event.origin !== IDENTITY_ORIGIN) return

      if (event.data?.type === 'webonone:auth:success') {
        dispatch(
          authActions.loginSuccess({
            accessToken: event.data.accessToken,
            user: event.data.user,
          }),
        )
        navigate(returnPath, { replace: true })
        return
      }

      if (event.data?.type === 'webonone:auth:cancel') {
        navigate('/login', { replace: true })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [dispatch, navigate, returnPath])
}
