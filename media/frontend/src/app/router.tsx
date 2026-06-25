import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useRedirectThemeBootstrap } from '@webonone/theme'
import { AppLayout } from '@/app/AppLayout'
import { AuthCallbackPage } from '@/features/auth/pages/AuthCallbackPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { LibraryPage } from '@/features/media/pages/LibraryPage'
import { ComponentShowcasePage } from '@/features/media/pages/ComponentShowcasePage'
import { PickerPage } from '@/features/media/pages/PickerPage'
import { UploadPage } from '@/features/media/pages/UploadPage'
import { UploadDialogPage } from '@/features/media/pages/UploadDialogPage'
import { SelectorPage } from '@/features/media/pages/SelectorPage'
import { ViewerPage } from '@/features/media/pages/ViewerPage'
import { FullDialogPage } from '@/features/media/pages/FullDialogPage'
import { useAppSelector } from '@/app/store/hooks'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  if (!accessToken) {
    return <Navigate to="/login" replace />
  }
  return children
}

export function App() {
  useRedirectThemeBootstrap()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/callback" element={<AuthCallbackPage />} />
        <Route path="/picker" element={<PickerPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/upload-dialog" element={<UploadDialogPage />} />
        <Route path="/selector" element={<SelectorPage />} />
        <Route path="/viewer" element={<ViewerPage />} />
        <Route path="/dialog" element={<FullDialogPage />} />
        <Route
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/components" element={<ComponentShowcasePage />} />
        </Route>
        <Route path="/" element={<Navigate to="/library" replace />} />
        <Route path="*" element={<Navigate to="/library" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
