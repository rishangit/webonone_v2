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
const SendEmailPage = lazy(() =>
  import('@/features/send/pages/SendPage').then((m) => ({ default: m.SendEmailPage })),
)
const TemplatesPage = lazy(() =>
  import('@/features/templates/pages/TemplatesPage').then((m) => ({ default: m.TemplatesPage })),
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
const TemplateFormEmbedPage = lazy(() =>
  import('@/features/templates/pages/TemplateFormEmbedPage').then((m) => ({
    default: m.TemplateFormEmbedPage,
  })),
)
const HistoryPage = lazy(() =>
  import('@/features/history/pages/HistoryPage').then((m) => ({ default: m.HistoryPage })),
)
const QueuePage = lazy(() =>
  import('@/features/queue/pages/QueuePage').then((m) => ({ default: m.QueuePage })),
)
const TestEmailPage = lazy(() =>
  import('@/features/test/pages/TestPage').then((m) => ({ default: m.TestEmailPage })),
)
const ProvidersPage = lazy(() =>
  import('@/features/providers/pages/ProvidersPage').then((m) => ({ default: m.ProvidersPage })),
)
const SettingsPage = lazy(() =>
  import('@/features/settings/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
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
                  <SendEmailPage />
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
            path="/test"
            element={
              <RoleRoute roles={[...adminRoles]}>
                <LazyRoute>
                  <TestEmailPage />
                </LazyRoute>
              </RoleRoute>
            }
          />
          <Route
            path="/providers"
            element={
              <RoleRoute roles={['super_admin']}>
                <LazyRoute>
                  <ProvidersPage />
                </LazyRoute>
              </RoleRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <RoleRoute roles={[...adminRoles]}>
                <LazyRoute>
                  <SettingsPage />
                </LazyRoute>
              </RoleRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
