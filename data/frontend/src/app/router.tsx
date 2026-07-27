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
const TagPickerPage = lazy(() =>
  import('@/features/tags/pages/TagPickerPage').then((m) => ({ default: m.TagPickerPage })),
)
const TagCreatePage = lazy(() =>
  import('@/features/tags/pages/TagCreatePage').then((m) => ({ default: m.TagCreatePage })),
)
const TagFormEmbedPage = lazy(() =>
  import('@/features/tags/pages/TagFormEmbedPage').then((m) => ({ default: m.TagFormEmbedPage })),
)
const ConfirmDeleteEmbedPage = lazy(() =>
  import('@/shared/components/ConfirmDeleteDialog').then((m) => ({
    default: m.ConfirmDeleteEmbedPage,
  })),
)
const TagSelectEmbedPage = lazy(() =>
  import('@/features/tags/pages/TagSelectEmbedPage').then((m) => ({
    default: m.TagSelectEmbedPage,
  })),
)
const UnitsPage = lazy(() =>
  import('@/features/units/pages/UnitsPage').then((m) => ({ default: m.UnitsPage })),
)
const UnitFormEmbedPage = lazy(() =>
  import('@/features/units/pages/UnitFormEmbedPage').then((m) => ({ default: m.UnitFormEmbedPage })),
)
const AttributesPage = lazy(() =>
  import('@/features/attributes/pages/AttributesPage').then((m) => ({ default: m.AttributesPage })),
)
const AttributeFormEmbedPage = lazy(() =>
  import('@/features/attributes/pages/AttributeFormEmbedPage').then((m) => ({
    default: m.AttributeFormEmbedPage,
  })),
)
const ProductsPage = lazy(() =>
  import('@/features/products/pages/ProductsPage').then((m) => ({ default: m.ProductsPage })),
)
const ProductDetailsPage = lazy(() =>
  import('@/features/products/pages/ProductDetailsPage').then((m) => ({
    default: m.ProductDetailsPage,
  })),
)
const ServicesPage = lazy(() =>
  import('@/features/services/pages/ServicesPage').then((m) => ({ default: m.ServicesPage })),
)
const ServiceDetailsPage = lazy(() =>
  import('@/features/services/pages/ServiceDetailsPage').then((m) => ({
    default: m.ServiceDetailsPage,
  })),
)
const SpacesPage = lazy(() =>
  import('@/features/spaces/pages/SpacesPage').then((m) => ({ default: m.SpacesPage })),
)
const SpaceDetailsPage = lazy(() =>
  import('@/features/spaces/pages/SpaceDetailsPage').then((m) => ({
    default: m.SpaceDetailsPage,
  })),
)
const TagDetailsPage = lazy(() =>
  import('@/features/tags/pages/TagDetailsPage').then((m) => ({ default: m.TagDetailsPage })),
)
const CatalogLibrarySelectEmbedPage = lazy(() =>
  import('@/features/catalog/pages/CatalogLibrarySelectEmbedPage').then((m) => ({
    default: m.CatalogLibrarySelectEmbedPage,
  })),
)
const CatalogFormEmbedPage = lazy(() =>
  import('@/features/catalog/pages/CatalogFormEmbedPage').then((m) => ({
    default: m.CatalogFormEmbedPage,
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

function entityRoutes(
  base: string,
  ListPage: React.LazyExoticComponent<() => React.JSX.Element>,
) {
  return (
    <Route
      path={base}
      element={
        <LazyRoute>
          <ListPage />
        </LazyRoute>
      }
    />
  )
}

function embedDialogRoute(
  path: string,
  Page: React.LazyExoticComponent<() => React.JSX.Element>,
) {
  return (
    <Route
      path={path}
      element={
        <LazyRoute>
          <Page />
        </LazyRoute>
      }
    />
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
          <Route
            path="/tag-picker"
            element={
              <LazyRoute>
                <TagPickerPage />
              </LazyRoute>
            }
          />
          <Route
            path="/tag-create"
            element={
              <LazyRoute>
                <TagCreatePage />
              </LazyRoute>
            }
          />
          {embedDialogRoute('/embed/dialogs/confirm-delete', ConfirmDeleteEmbedPage)}
          {embedDialogRoute('/embed/dialogs/tags/select', TagSelectEmbedPage)}
          {embedDialogRoute('/embed/dialogs/tags/create', TagFormEmbedPage)}
          {embedDialogRoute('/embed/dialogs/tags/:id/edit', TagFormEmbedPage)}
          {embedDialogRoute('/embed/dialogs/units/create', UnitFormEmbedPage)}
          {embedDialogRoute('/embed/dialogs/units/:id/edit', UnitFormEmbedPage)}
          {embedDialogRoute('/embed/dialogs/attributes/create', AttributeFormEmbedPage)}
          {embedDialogRoute('/embed/dialogs/attributes/:id/edit', AttributeFormEmbedPage)}
          {embedDialogRoute('/embed/dialogs/catalog/:kind/select', CatalogLibrarySelectEmbedPage)}
          {embedDialogRoute('/embed/dialogs/:kind/create', CatalogFormEmbedPage)}
          {embedDialogRoute('/embed/dialogs/:kind/:id/edit', CatalogFormEmbedPage)}
          {entityRoutes('/tags', TagsPage)}
          <Route
            path="/tags/:tagId"
            element={
              <LazyRoute>
                <TagDetailsPage />
              </LazyRoute>
            }
          />
          {entityRoutes('/units', UnitsPage)}
          {entityRoutes('/attributes', AttributesPage)}
          {entityRoutes('/products', ProductsPage)}
          <Route
            path="/products/:productId"
            element={
              <LazyRoute>
                <ProductDetailsPage />
              </LazyRoute>
            }
          />
          {entityRoutes('/services', ServicesPage)}
          <Route
            path="/services/:serviceId"
            element={
              <LazyRoute>
                <ServiceDetailsPage />
              </LazyRoute>
            }
          />
          {entityRoutes('/spaces', SpacesPage)}
          <Route
            path="/spaces/:spaceId"
            element={
              <LazyRoute>
                <SpaceDetailsPage />
              </LazyRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
