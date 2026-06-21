import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthCallbackPage } from '@/features/auth/pages/AuthCallbackPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { LibraryPage } from '@/features/media/pages/LibraryPage'
import { PickerPage } from '@/features/media/pages/PickerPage'
import { UploadPage } from '@/features/media/pages/UploadPage'
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
        <Route path="/picker" element={<PickerPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route
          path="/library"
          element={
            <PrivateRoute>
              <LibraryPage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/library" replace />} />
        <Route path="*" element={<Navigate to="/library" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
