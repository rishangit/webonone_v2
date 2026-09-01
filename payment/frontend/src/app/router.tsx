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

const DashboardPage = lazy(() =>
  import('@/features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const InvoicesPage = lazy(() =>
  import('@/features/invoices/pages/InvoicesPage').then((m) => ({ default: m.InvoicesPage })),
)
const InvoicesFilterEmbedPage = lazy(() =>
  import('@/features/invoices/pages/InvoicesFilterEmbedPage').then((m) => ({
    default: m.InvoicesFilterEmbedPage,
  })),
)
const InvoiceDetailPage = lazy(() =>
  import('@/features/invoices/pages/InvoiceDetailPage').then((m) => ({
    default: m.InvoiceDetailPage,
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

const adminRoles = ['super_admin', 'company_admin'] as const

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
                <RoleRoute roles={[...adminRoles]}>
                  <LazyRoute>
                    <DashboardPage />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/embed/panels/invoices/filters"
              element={
                <RoleRoute roles={[...adminRoles]}>
                  <LazyRoute>
                    <InvoicesFilterEmbedPage />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <RoleRoute roles={[...adminRoles]}>
                  <LazyRoute>
                    <InvoicesPage />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/invoices/:id"
              element={
                <RoleRoute roles={[...adminRoles]}>
                  <LazyRoute>
                    <InvoiceDetailPage />
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
