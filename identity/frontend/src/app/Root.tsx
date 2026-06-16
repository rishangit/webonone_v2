import { GoogleOAuthProvider } from '@react-oauth/google'
import { App } from '@/app/App'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

export function Root() {
  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        <App />
      </GoogleOAuthProvider>
    )
  }
  return <App />
}
