import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from '@/app/store/hooks'
import { authActions } from '../store'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export function GoogleSignInButton() {
  const { t } = useTranslation('auth')
  const dispatch = useAppDispatch()

  if (!GOOGLE_CLIENT_ID) {
    return null
  }

  function handleSuccess(response: CredentialResponse) {
    if (!response.credential) return
    dispatch(authActions.clearAuthError())
    dispatch(authActions.googleLoginRequested({ idToken: response.credential }))
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => dispatch(authActions.loginFailed(t('googleSignInFailed')))}
        useOneTap={false}
        theme="outline"
        size="large"
        width="100%"
        text="continue_with"
      />
    </div>
  )
}
