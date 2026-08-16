import { lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import { useRedirectThemeBootstrap } from '@webonone/theme'
import { ToastProvider } from '@webonone/ui-kit'
import { AppLayout } from '@/app/AppLayout'
import { LazyRoute } from '@/app/LazyRoute'
import { RoleRoute } from '@/app/RoleRoute'
import { AuthCallbackPage } from '@/features/auth/pages/AuthCallbackPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { useAppSelector } from '@/app/store/hooks'
import { hasAnyPlatformHandoff } from '@/features/auth/utils/platformReturn'

const ConversationsPage = lazy(() =>
  import('@/features/chat/pages/ConversationsPage').then((m) => ({ default: m.ConversationsPage })),
)
const ConversationPage = lazy(() =>
  import('@/features/chat/pages/ConversationPage').then((m) => ({ default: m.ConversationPage })),
)

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [searchParams] = useSearchParams()

  if (!accessToken && !hasAnyPlatformHandoff(searchParams)) {
    return <Navigate to="/login" replace />
  }

  return children
}

const allRoles = ['super_admin', 'company_admin', 'member'] as const

export function App() {
  useRedirectThemeBootstrap()

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/callback" element={<AuthCallbackPage />} />
          <Route
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route
              path="/"
              element={
                <RoleRoute roles={[...allRoles]}>
                  <LazyRoute>
                    <ConversationsPage />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/conversations/:id"
              element={
                <RoleRoute roles={[...allRoles]}>
                  <LazyRoute>
                    <ConversationPage />
                  </LazyRoute>
                </RoleRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
