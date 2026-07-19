import { lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/app/AppLayout'
import { LazyRoute } from '@/app/LazyRoute'
import { AuthCallbackPage } from '@/features/auth/pages/AuthCallbackPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { useAppSelector } from '@/app/store/hooks'

const HomePage = lazy(() =>
  import('@/features/home/pages/HomePage').then((m) => ({ default: m.HomePage })),
)
const CompaniesPage = lazy(() =>
  import('@/features/settings/basic/pages/CompaniesPage').then((m) => ({ default: m.CompaniesPage })),
)
const BasicSettingsPage = lazy(() =>
  import('@/features/settings/basic/pages/BasicSettingsPage').then((m) => ({
    default: m.BasicSettingsPage,
  })),
)
const SystemThemePage = lazy(() =>
  import('@/features/settings/system-theme/pages/SystemThemePage').then((m) => ({
    default: m.SystemThemePage,
  })),
)
const PlatformPeerFrame = lazy(() =>
  import('@/features/shell/pages/PlatformPeerFrame').then((m) => ({ default: m.PlatformPeerFrame })),
)

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  if (!accessToken) {
    return <Navigate to="/login" replace />
  }
  return children
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const selectionComplete = useAppSelector((s) => s.sessionRole.selectionComplete)
  if (!selectionComplete) {
    return null
  }
  if (activeRole !== 'super_admin') {
    return <Navigate to="/" replace />
  }
  return children
}

export function App() {
  return (
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
            index
            element={
              <LazyRoute>
                <HomePage />
              </LazyRoute>
            }
          />
          <Route
            path="companies"
            element={
              <SuperAdminRoute>
                <LazyRoute>
                  <CompaniesPage />
                </LazyRoute>
              </SuperAdminRoute>
            }
          />
          <Route
            path="settings/basic"
            element={
              <LazyRoute>
                <BasicSettingsPage />
              </LazyRoute>
            }
          />
          <Route
            path="settings/system-theme"
            element={
              <LazyRoute>
                <SystemThemePage />
              </LazyRoute>
            }
          />
          <Route
            path="email/*"
            element={
              <LazyRoute>
                <PlatformPeerFrame peer="email" />
              </LazyRoute>
            }
          />
          <Route
            path="data/*"
            element={
              <LazyRoute>
                <PlatformPeerFrame peer="data" />
              </LazyRoute>
            }
          />
          <Route
            path="profile/*"
            element={
              <LazyRoute>
                <PlatformPeerFrame peer="identity" />
              </LazyRoute>
            }
          />
          <Route
            path="identity/*"
            element={
              <SuperAdminRoute>
                <LazyRoute>
                  <PlatformPeerFrame peer="identity" />
                </LazyRoute>
              </SuperAdminRoute>
            }
          />
        </Route>
        <Route path="admin/companies/login" element={<Navigate to="/login" replace />} />
        <Route path="admin/companies/pending" element={<Navigate to="/companies" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
