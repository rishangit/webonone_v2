import { useLayoutEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppDispatch } from '@/app/store/hooks'
import { authActions } from '../store/authSlice'
import { isPromptLoginRequest } from '../utils/authStorage'

/** Clears a stale Identity session when a consumer sends `prompt=login`. */
export function usePromptLoginSessionClear(): void {
  const [searchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const clearedRef = useRef(false)
  const promptLogin = searchParams.get('prompt') === 'login' || isPromptLoginRequest()

  useLayoutEffect(() => {
    if (!promptLogin || clearedRef.current) {
      return
    }
    clearedRef.current = true
    dispatch(authActions.logout())
  }, [dispatch, promptLogin])
}
