import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/app/AppLayout'
import { AuthCallbackPage } from '@/features/auth/pages/AuthCallbackPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { HomePage } from '@/features/home/pages/HomePage'
import { SystemThemePage } from '@/features/settings/system-theme/pages/SystemThemePage'
import { BasicSettingsPage } from '@/features/settings/basic/pages/BasicSettingsPage'
import { CompaniesPage } from '@/features/settings/basic/pages/CompaniesPage'
import { useAppSelector } from '@/app/store/hooks'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  if (!accessToken) {
    return <Navigate to="/login" replace />
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
          <Route index element={<HomePage />} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="settings/basic" element={<BasicSettingsPage />} />
          <Route path="settings/system-theme" element={<SystemThemePage />} />
        </Route>
        <Route path="admin/companies/login" element={<Navigate to="/login" replace />} />
        <Route path="admin/companies/pending" element={<Navigate to="/companies" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
