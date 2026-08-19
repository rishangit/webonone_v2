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
const FormFillPage = lazy(() =>
  import('@/features/forms/pages/FormFillPage').then((m) => ({ default: m.FormFillPage })),
)
const FormCreateEmbedPage = lazy(() =>
  import('@/features/forms/pages/FormCreateEmbedPage').then((m) => ({
    default: m.FormCreateEmbedPage,
  })),
)
const FormFillEmbedPage = lazy(() =>
  import('@/features/forms/pages/FormFillEmbedPage').then((m) => ({
    default: m.FormFillEmbedPage,
  })),
)
const WebsitePagesPage = lazy(() =>
  import('@/features/website/pages/WebsitePagesPage').then((m) => ({ default: m.WebsitePagesPage })),
)
const WebsiteHeadersPage = lazy(() =>
  import('@/features/website/pages/WebsiteChromePage').then((m) => ({ default: m.WebsiteHeadersPage })),
)
const WebsiteFootersPage = lazy(() =>
  import('@/features/website/pages/WebsiteChromePage').then((m) => ({ default: m.WebsiteFootersPage })),
)
const WebsiteThemesPage = lazy(() =>
  import('@/features/website/pages/WebsiteThemesPage').then((m) => ({ default: m.WebsiteThemesPage })),
)
const WebsiteThemeEditorPage = lazy(() =>
  import('@/features/website/pages/WebsiteThemeEditorPage').then((m) => ({
    default: m.WebsiteThemeEditorPage,
  })),
)
const WebsiteMediaPage = lazy(() =>
  import('@/features/website/pages/WebsiteMediaPage').then((m) => ({ default: m.WebsiteMediaPage })),
)
const WebsiteDesignerPage = lazy(() =>
  import('@/features/website/pages/WebsiteDesignerPage').then((m) => ({ default: m.WebsiteDesignerPage })),
)
const WebsitePublicPage = lazy(() =>
  import('@/features/website/pages/WebsitePublicPage').then((m) => ({ default: m.WebsitePublicPage })),
)
const WebsitePageCreateEmbedPage = lazy(() =>
  import('@/features/website/pages/WebsitePageCreateEmbedPage').then((m) => ({
    default: m.WebsitePageCreateEmbedPage,
  })),
)
const WebsiteChromeCreateEmbedPage = lazy(() =>
  import('@/features/website/pages/WebsiteChromeCreateEmbedPage').then((m) => ({
    default: m.WebsiteChromeCreateEmbedPage,
  })),
)
const WebsiteThemeCreateEmbedPage = lazy(() =>
  import('@/features/website/pages/WebsiteChromeCreateEmbedPage').then((m) => ({
    default: m.WebsiteThemeCreateEmbedPage,
  })),
)
const WebsiteThemeTokenEmbedPage = lazy(() =>
  import('@/features/website/pages/WebsiteThemeTokenEmbedPage').then((m) => ({
    default: m.WebsiteThemeTokenEmbedPage,
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
            path="/s/:companyId"
            element={
              <LazyRoute>
                <WebsitePublicPage />
              </LazyRoute>
            }
          />
          <Route
            path="/s/:companyId/*"
            element={
              <LazyRoute>
                <WebsitePublicPage />
              </LazyRoute>
            }
          />
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
              path="/forms/:id/fill"
              element={
                <RoleRoute roles={[...companyRoles]}>
                  <LazyRoute>
                    <FormFillPage />
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
            <Route
              path="/embed/dialogs/forms/:id/fill"
              element={
                <RoleRoute roles={[...companyRoles]}>
                  <LazyRoute>
                    <FormFillEmbedPage />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route path="/website" element={<Navigate to="/website/pages" replace />} />
            <Route
              path="/website/pages"
              element={
                <RoleRoute roles={[...companyRoles]}>
                  <LazyRoute>
                    <WebsitePagesPage />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/website/pages/:id/edit"
              element={
                <RoleRoute roles={[...companyRoles]}>
                  <LazyRoute>
                    <WebsiteDesignerPage kind="pages" />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/website/headers"
              element={
                <RoleRoute roles={[...companyRoles]}>
                  <LazyRoute>
                    <WebsiteHeadersPage />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/website/headers/:id/edit"
              element={
                <RoleRoute roles={[...companyRoles]}>
                  <LazyRoute>
                    <WebsiteDesignerPage kind="headers" />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/website/footers"
              element={
                <RoleRoute roles={[...companyRoles]}>
                  <LazyRoute>
                    <WebsiteFootersPage />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/website/footers/:id/edit"
              element={
                <RoleRoute roles={[...companyRoles]}>
                  <LazyRoute>
                    <WebsiteDesignerPage kind="footers" />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/website/themes"
              element={
                <RoleRoute roles={[...companyRoles]}>
                  <LazyRoute>
                    <WebsiteThemesPage />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/website/themes/:id"
              element={
                <RoleRoute roles={[...companyRoles]}>
                  <LazyRoute>
                    <WebsiteThemeEditorPage />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/website/media"
              element={
                <RoleRoute roles={[...companyRoles]}>
                  <LazyRoute>
                    <WebsiteMediaPage />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/embed/dialogs/website/pages/create"
              element={
                <RoleRoute roles={[...manageRoles]}>
                  <LazyRoute>
                    <WebsitePageCreateEmbedPage />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/embed/dialogs/website/pages/:id"
              element={
                <RoleRoute roles={[...manageRoles]}>
                  <LazyRoute>
                    <WebsitePageCreateEmbedPage />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/embed/dialogs/website/headers/create"
              element={
                <RoleRoute roles={[...manageRoles]}>
                  <LazyRoute>
                    <WebsiteChromeCreateEmbedPage kind="headers" />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/embed/dialogs/website/footers/create"
              element={
                <RoleRoute roles={[...manageRoles]}>
                  <LazyRoute>
                    <WebsiteChromeCreateEmbedPage kind="footers" />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/embed/dialogs/website/themes/create"
              element={
                <RoleRoute roles={[...manageRoles]}>
                  <LazyRoute>
                    <WebsiteThemeCreateEmbedPage />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/embed/dialogs/website/themes/:themeId/fonts/create"
              element={
                <RoleRoute roles={[...manageRoles]}>
                  <LazyRoute>
                    <WebsiteThemeTokenEmbedPage kind="fonts" />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/embed/dialogs/website/themes/:themeId/fonts/:tokenId"
              element={
                <RoleRoute roles={[...manageRoles]}>
                  <LazyRoute>
                    <WebsiteThemeTokenEmbedPage kind="fonts" />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/embed/dialogs/website/themes/:themeId/colors/create"
              element={
                <RoleRoute roles={[...manageRoles]}>
                  <LazyRoute>
                    <WebsiteThemeTokenEmbedPage kind="colors" />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/embed/dialogs/website/themes/:themeId/colors/:tokenId"
              element={
                <RoleRoute roles={[...manageRoles]}>
                  <LazyRoute>
                    <WebsiteThemeTokenEmbedPage kind="colors" />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/embed/dialogs/website/themes/:themeId/texts/create"
              element={
                <RoleRoute roles={[...manageRoles]}>
                  <LazyRoute>
                    <WebsiteThemeTokenEmbedPage kind="texts" />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/embed/dialogs/website/themes/:themeId/texts/:tokenId"
              element={
                <RoleRoute roles={[...manageRoles]}>
                  <LazyRoute>
                    <WebsiteThemeTokenEmbedPage kind="texts" />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/embed/dialogs/website/themes/:themeId/buttons/create"
              element={
                <RoleRoute roles={[...manageRoles]}>
                  <LazyRoute>
                    <WebsiteThemeTokenEmbedPage kind="buttons" />
                  </LazyRoute>
                </RoleRoute>
              }
            />
            <Route
              path="/embed/dialogs/website/themes/:themeId/buttons/:tokenId"
              element={
                <RoleRoute roles={[...manageRoles]}>
                  <LazyRoute>
                    <WebsiteThemeTokenEmbedPage kind="buttons" />
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
