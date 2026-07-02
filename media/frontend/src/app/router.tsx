import { lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useRedirectThemeBootstrap } from '@webonone/theme'
import { AppLayout } from '@/app/AppLayout'
import { LazyRoute } from '@/app/LazyRoute'
import { AuthCallbackPage } from '@/features/auth/pages/AuthCallbackPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { PickerPage } from '@/features/media/pages/PickerPage'
import { UploadPage } from '@/features/media/pages/UploadPage'
import { UploadDialogPage } from '@/features/media/pages/UploadDialogPage'
import { SelectorPage } from '@/features/media/pages/SelectorPage'
import { ViewerPage } from '@/features/media/pages/ViewerPage'
import { CropDialogPage } from '@/features/media/pages/CropDialogPage'
import { FullDialogPage } from '@/features/media/pages/FullDialogPage'
import { useAppSelector } from '@/app/store/hooks'

const LibraryPage = lazy(() =>
  import('@/features/media/pages/LibraryPage').then((m) => ({ default: m.LibraryPage })),
)
const ComponentShowcasePage = lazy(() =>
  import('@/features/media/pages/ComponentShowcasePage').then((m) => ({
    default: m.ComponentShowcasePage,
  })),
)

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
        <Route path="/crop-dialog" element={<CropDialogPage />} />
        <Route path="/viewer" element={<ViewerPage />} />
        <Route path="/dialog" element={<FullDialogPage />} />
        <Route
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route
            path="/library"
            element={
              <LazyRoute>
                <LibraryPage />
              </LazyRoute>
            }
          />
          <Route
            path="/components"
            element={
              <LazyRoute>
                <ComponentShowcasePage />
              </LazyRoute>
            }
          />
        </Route>
        <Route path="/" element={<Navigate to="/library" replace />} />
        <Route path="*" element={<Navigate to="/library" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
