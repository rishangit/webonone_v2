import { GoogleOAuthProvider } from '@react-oauth/google'
import { useRedirectThemeBootstrap } from '@webonone/theme'
import { App } from '@/app/App'
import { useAuthSessionBootstrap } from '@/features/auth/hooks/useAuthSessionBootstrap'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

function ThemeBootstrap({ children }: { children: React.ReactNode }) {
  useRedirectThemeBootstrap()
  return children
}

function AuthSessionBootstrap({ children }: { children: React.ReactNode }) {
  useAuthSessionBootstrap()
  return children
}

export function Root() {
  const app = (
    <ThemeBootstrap>
      <AuthSessionBootstrap>
        <App />
      </AuthSessionBootstrap>
    </ThemeBootstrap>
  )

  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        {app}
      </GoogleOAuthProvider>
    )
  }
  return app
}
