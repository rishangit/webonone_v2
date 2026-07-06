import { lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import { useRedirectThemeBootstrap } from '@webonone/theme'
import { AppLayout } from '@/app/AppLayout'
import { LazyRoute } from '@/app/LazyRoute'
import { AuthCallbackPage } from '@/features/auth/pages/AuthCallbackPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { useAppSelector } from '@/app/store/hooks'
import { hasAnyPlatformHandoff } from '@/features/auth/utils/platformReturn'

const DashboardPage = lazy(() =>
  import('@/features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const TagsPage = lazy(() =>
  import('@/features/tags/pages/TagsPage').then((m) => ({ default: m.TagsPage })),
)
const TagEditorPage = lazy(() =>
  import('@/features/tags/pages/TagEditorPage').then((m) => ({ default: m.TagEditorPage })),
)
const UnitsPage = lazy(() =>
  import('@/features/units/pages/UnitsPage').then((m) => ({ default: m.UnitsPage })),
)
const UnitEditorPage = lazy(() =>
  import('@/features/units/pages/UnitEditorPage').then((m) => ({ default: m.UnitEditorPage })),
)
const AttributesPage = lazy(() =>
  import('@/features/attributes/pages/AttributesPage').then((m) => ({ default: m.AttributesPage })),
)
const AttributeEditorPage = lazy(() =>
  import('@/features/attributes/pages/AttributeEditorPage').then((m) => ({ default: m.AttributeEditorPage })),
)
const ProductsPage = lazy(() =>
  import('@/features/products/pages/ProductsPage').then((m) => ({ default: m.ProductsPage })),
)
const ProductEditorPage = lazy(() =>
  import('@/features/products/pages/ProductEditorPage').then((m) => ({ default: m.ProductEditorPage })),
)
const ServicesPage = lazy(() =>
  import('@/features/services/pages/ServicesPage').then((m) => ({ default: m.ServicesPage })),
)
const ServiceEditorPage = lazy(() =>
  import('@/features/services/pages/ServiceEditorPage').then((m) => ({ default: m.ServiceEditorPage })),
)
const SpacesPage = lazy(() =>
  import('@/features/spaces/pages/SpacesPage').then((m) => ({ default: m.SpacesPage })),
)
const SpaceEditorPage = lazy(() =>
  import('@/features/spaces/pages/SpaceEditorPage').then((m) => ({ default: m.SpaceEditorPage })),
)

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [searchParams] = useSearchParams()

  if (!accessToken && !hasAnyPlatformHandoff(searchParams)) {
    return <Navigate to="/login" replace />
  }

  return children
}

function entityRoutes(
  base: string,
  ListPage: React.LazyExoticComponent<() => React.JSX.Element>,
  EditorPage: React.LazyExoticComponent<() => React.JSX.Element>,
) {
  return (
    <>
      <Route
        path={base}
        element={
          <LazyRoute>
            <ListPage />
          </LazyRoute>
        }
      />
      <Route
        path={`${base}/new`}
        element={
          <LazyRoute>
            <EditorPage />
          </LazyRoute>
        }
      />
      <Route
        path={`${base}/:id`}
        element={
          <LazyRoute>
            <EditorPage />
          </LazyRoute>
        }
      />
    </>
  )
}

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
          {entityRoutes('/tags', TagsPage, TagEditorPage)}
          {entityRoutes('/units', UnitsPage, UnitEditorPage)}
          {entityRoutes('/attributes', AttributesPage, AttributeEditorPage)}
          {entityRoutes('/products', ProductsPage, ProductEditorPage)}
          {entityRoutes('/services', ServicesPage, ServiceEditorPage)}
          {entityRoutes('/spaces', SpacesPage, SpaceEditorPage)}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
