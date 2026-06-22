import { GoogleOAuthProvider } from '@react-oauth/google'
import { useRedirectThemeBootstrap } from '@webonone/theme'
import { App } from '@/app/App'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

function ThemeBootstrap({ children }: { children: React.ReactNode }) {
  useRedirectThemeBootstrap()
  return children
}

export function Root() {
  const app = (
    <ThemeBootstrap>
      <App />
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
