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

const FormsPage = lazy(() =>
  import('@/features/forms/pages/FormsPage').then((m) => ({ default: m.FormsPage })),
)
const FormDesignerPage = lazy(() =>
  import('@/features/forms/pages/FormDesignerPage').then((m) => ({ default: m.FormDesignerPage })),
)
const FormCreateEmbedPage = lazy(() =>
  import('@/features/forms/pages/FormCreateEmbedPage').then((m) => ({
    default: m.FormCreateEmbedPage,
  })),
)

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [searchParams] = useSearchParams()

  if (!accessToken && !hasAnyPlatformHandoff(searchParams)) {
    return <Navigate to="/login" replace />
  }

  return children
}

const companyRoles = ['super_admin', 'company_admin', 'member'] as const
const manageRoles = ['super_admin', 'company_admin'] as const

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
            <Route path="/" element={<Navigate to="/forms" replace />} />
            <Route
              path="/forms"
              element={
                <RoleRoute roles={[...companyRoles]}>
                  <LazyRoute>
                    <FormsPage />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/forms/:id/edit"
              element={
                <RoleRoute roles={[...companyRoles]}>
                  <LazyRoute>
                    <FormDesignerPage />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/embed/dialogs/forms/create"
              element={
                <RoleRoute roles={[...manageRoles]}>
                  <LazyRoute>
                    <FormCreateEmbedPage />
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
