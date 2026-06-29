import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import { useRedirectThemeBootstrap } from '@webonone/theme'
import { AppLayout } from '@/app/AppLayout'
import { RoleRoute } from '@/app/RoleRoute'
import { AuthCallbackPage } from '@/features/auth/pages/AuthCallbackPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { HistoryPage } from '@/features/history/pages/HistoryPage'
import { ProvidersPage } from '@/features/providers/pages/ProvidersPage'
import { QueuePage } from '@/features/queue/pages/QueuePage'
import { SendEmailPage } from '@/features/send/pages/SendPage'
import { SettingsPage } from '@/features/settings/pages/SettingsPage'
import { TemplateEditorPage } from '@/features/templates/pages/TemplateEditorPage'
import { TemplatePreviewPage } from '@/features/templates/pages/TemplatePreviewPage'
import { TemplatesPage } from '@/features/templates/pages/TemplatesPage'
import { TestEmailPage } from '@/features/test/pages/TestPage'
import { useAppSelector } from '@/app/store/hooks'
import { hasPlatformHandoff } from '@/features/auth/utils/platformReturn'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [searchParams] = useSearchParams()

  if (!accessToken && !hasPlatformHandoff(searchParams)) {
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
          <Route path="/" element={<DashboardPage />} />
          <Route
            path="/send"
            element={
              <RoleRoute roles={[...adminRoles]}>
                <SendEmailPage />
              </RoleRoute>
            }
          />
          <Route
            path="/templates"
            element={
              <RoleRoute roles={[...adminRoles]}>
                <TemplatesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/templates/:id"
            element={
              <RoleRoute roles={[...adminRoles]}>
                <TemplateEditorPage />
              </RoleRoute>
            }
          />
          <Route
            path="/templates/:id/preview"
            element={
              <RoleRoute roles={[...adminRoles]}>
                <TemplatePreviewPage />
              </RoleRoute>
            }
          />
          <Route
            path="/history"
            element={
              <RoleRoute roles={[...adminRoles]}>
                <HistoryPage />
              </RoleRoute>
            }
          />
          <Route
            path="/queue"
            element={
              <RoleRoute roles={[...adminRoles]}>
                <QueuePage />
              </RoleRoute>
            }
          />
          <Route
            path="/test"
            element={
              <RoleRoute roles={[...adminRoles]}>
                <TestEmailPage />
              </RoleRoute>
            }
          />
          <Route
            path="/providers"
            element={
              <RoleRoute roles={['super_admin']}>
                <ProvidersPage />
              </RoleRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <RoleRoute roles={[...adminRoles]}>
                <SettingsPage />
              </RoleRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

