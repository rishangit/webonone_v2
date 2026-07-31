import { lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import { useRedirectThemeBootstrap } from '@webonone/theme'
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
const SendPage = lazy(() =>
  import('@/features/send/pages/SendPage').then((m) => ({ default: m.SendPage })),
)
const DevicesPage = lazy(() =>
  import('@/features/devices/pages/DevicesPage').then((m) => ({ default: m.DevicesPage })),
)
const QueuePage = lazy(() =>
  import('@/features/queue/pages/QueuePage').then((m) => ({ default: m.QueuePage })),
)
const HistoryPage = lazy(() =>
  import('@/features/history/pages/HistoryPage').then((m) => ({ default: m.HistoryPage })),
)
const TemplatesPage = lazy(() =>
  import('@/features/templates/pages/TemplatesPage').then((m) => ({ default: m.TemplatesPage })),
)
const TemplateFormEmbedPage = lazy(() =>
  import('@/features/templates/pages/TemplateFormEmbedPage').then((m) => ({
    default: m.TemplateFormEmbedPage,
  })),
)
const TemplateDetailsPage = lazy(() =>
  import('@/features/templates/pages/TemplateDetailsPage').then((m) => ({
    default: m.TemplateDetailsPage,
  })),
)
const TemplateEditorPage = lazy(() =>
  import('@/features/templates/pages/TemplateEditorPage').then((m) => ({
    default: m.TemplateEditorPage,
  })),
)
const TemplatePreviewPage = lazy(() =>
  import('@/features/templates/pages/TemplatePreviewPage').then((m) => ({
    default: m.TemplatePreviewPage,
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
              <LazyRoute>
                <DashboardPage />
              </LazyRoute>
            }
          />
          <Route
            path="/send"
            element={
              <RoleRoute roles={[...adminRoles]}>
                <LazyRoute>
                  <SendPage />
                </LazyRoute>
              </RoleRoute>
            }
          />
          <Route
            path="/devices"
            element={
              <RoleRoute roles={[...adminRoles]}>
                <LazyRoute>
                  <DevicesPage />
                </LazyRoute>
              </RoleRoute>
            }
          />
          <Route
            path="/queue"
            element={
              <RoleRoute roles={[...adminRoles]}>
                <LazyRoute>
                  <QueuePage />
                </LazyRoute>
              </RoleRoute>
            }
          />
          <Route
            path="/history"
            element={
              <RoleRoute roles={[...adminRoles]}>
                <LazyRoute>
                  <HistoryPage />
                </LazyRoute>
              </RoleRoute>
            }
          />
          <Route
            path="/templates"
            element={
              <RoleRoute roles={[...adminRoles]}>
                <LazyRoute>
                  <TemplatesPage />
                </LazyRoute>
              </RoleRoute>
            }
          />
          <Route
            path="/embed/dialogs/templates/create"
            element={
              <RoleRoute roles={[...adminRoles]}>
                <LazyRoute>
                  <TemplateFormEmbedPage />
                </LazyRoute>
              </RoleRoute>
            }
          />
          <Route
            path="/embed/dialogs/templates/:id/edit"
            element={
              <RoleRoute roles={[...adminRoles]}>
                <LazyRoute>
                  <TemplateFormEmbedPage />
                </LazyRoute>
              </RoleRoute>
            }
          />
          <Route
            path="/templates/:id"
            element={
              <RoleRoute roles={[...adminRoles]}>
                <LazyRoute>
                  <TemplateDetailsPage />
                </LazyRoute>
              </RoleRoute>
            }
          />
          <Route
            path="/templates/:id/versions"
            element={
              <RoleRoute roles={[...adminRoles]}>
                <LazyRoute>
                  <TemplateEditorPage />
                </LazyRoute>
              </RoleRoute>
            }
          />
          <Route
            path="/templates/:id/preview"
            element={
              <RoleRoute roles={[...adminRoles]}>
                <LazyRoute>
                  <TemplatePreviewPage />
                </LazyRoute>
              </RoleRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
