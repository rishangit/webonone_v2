import { lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from '@/app/AppLayout'
import { LazyRoute } from '@/app/LazyRoute'
import { AuthCallbackPage } from '@/features/auth/pages/AuthCallbackPage'
import { ClearSessionPage } from '@/features/auth/pages/ClearSessionPage'
import { AuthHandoffPage } from '@/features/auth/pages/AuthHandoffPage'
import { AuthSsoBridgePage } from '@/features/auth/pages/AuthSsoBridgePage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { IdentityAuthPage } from '@/features/auth/pages/IdentityAuthPage'
import { useAuthStorageSync } from '@/features/auth/hooks/useAuthStorageSync'
import { buildWebOnOneLoginHref } from '@/features/auth/utils/buildWebOnOneLoginHref'
import { useAppSelector } from '@/app/store/hooks'

const HomePage = lazy(() =>
  import('@/features/home/pages/HomePage').then((m) => ({ default: m.HomePage })),
)
const AnalyticsPage = lazy(() =>
  import('@/features/analytics/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })),
)
const CompaniesPage = lazy(() =>
  import('@/features/settings/basic/pages/CompaniesPage').then((m) => ({ default: m.CompaniesPage })),
)
const AllCompaniesPage = lazy(() =>
  import('@/features/settings/companies/pages/AllCompaniesPage').then((m) => ({
    default: m.AllCompaniesPage,
  })),
)
const ConnectedCompaniesPage = lazy(() =>
  import('@/features/settings/companies/pages/ConnectedCompaniesPage').then((m) => ({
    default: m.ConnectedCompaniesPage,
  })),
)
const MemberCompanyProfilePage = lazy(() =>
  import('@/features/settings/companies/pages/CompanyProfilePage').then((m) => ({
    default: m.MemberCompanyProfilePage,
  })),
)
const MemberCompanyCatalogDetailPage = lazy(() =>
  import('@/features/settings/companies/pages/MemberCompanyCatalogDetailPage').then((m) => ({
    default: m.MemberCompanyCatalogDetailPage,
  })),
)
const AdminCompanyProfilePage = lazy(() =>
  import('@/features/settings/companies/pages/CompanyProfilePage').then((m) => ({
    default: m.AdminCompanyProfilePage,
  })),
)
const BasicSettingsPage = lazy(() =>
  import('@/features/settings/basic/pages/BasicSettingsPage').then((m) => ({
    default: m.BasicSettingsPage,
  })),
)
const SystemThemePage = lazy(() =>
  import('@/features/settings/system-theme/pages/SystemThemePage').then((m) => ({
    default: m.SystemThemePage,
  })),
)
const ThemeDetailPage = lazy(() =>
  import('@/features/settings/system-theme/pages/ThemeDetailPage').then((m) => ({
    default: m.ThemeDetailPage,
  })),
)
const PlatformPeerFrame = lazy(() =>
  import('@/features/shell/pages/PlatformPeerFrame').then((m) => ({ default: m.PlatformPeerFrame })),
)
const NotificationsPage = lazy(() =>
  import('@/features/notifications/pages/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  })),
)
const StaffPage = lazy(() =>
  import('@/features/staff/pages/StaffPage').then((m) => ({ default: m.StaffPage })),
)
const StaffDetailsPage = lazy(() =>
  import('@/features/staff/pages/StaffDetailsPage').then((m) => ({ default: m.StaffDetailsPage })),
)
const StaffHistoryTokenDetailPage = lazy(() =>
  import('@/features/staff/pages/StaffHistoryTokenDetailPage').then((m) => ({
    default: m.StaffHistoryTokenDetailPage,
  })),
)
const StaffHistorySubmissionDetailPage = lazy(() =>
  import('@/features/staff/pages/StaffHistorySubmissionDetailPage').then((m) => ({
    default: m.StaffHistorySubmissionDetailPage,
  })),
)
const PosPage = lazy(() =>
  import('@/features/sales/pages/PosPage').then((m) => ({ default: m.PosPage })),
)
const SalesHistoryPage = lazy(() =>
  import('@/features/sales/pages/SalesHistoryPage').then((m) => ({ default: m.SalesHistoryPage })),
)
const SaleBillPage = lazy(() =>
  import('@/features/sales/pages/SaleBillPage').then((m) => ({ default: m.SaleBillPage })),
)
const CalendarPage = lazy(() =>
  import('@/features/calendar/pages/CalendarPage').then((m) => ({ default: m.CalendarPage })),
)
const EventsPage = lazy(() =>
  import('@/features/calendar/pages/EventsPage').then((m) => ({ default: m.EventsPage })),
)
const EventDetailsPage = lazy(() =>
  import('@/features/calendar/pages/EventDetailsPage').then((m) => ({
    default: m.EventDetailsPage,
  })),
)
const SessionDetailsPage = lazy(() =>
  import('@/features/calendar/pages/SessionDetailsPage').then((m) => ({
    default: m.SessionDetailsPage,
  })),
)
const DataCatalogListRoute = lazy(() =>
  import('@/features/company-catalog/pages/DataCatalogRoutes').then((m) => ({
    default: m.DataCatalogListRoute,
  })),
)
const DataCatalogDetailRoute = lazy(() =>
  import('@/features/company-catalog/pages/DataCatalogRoutes').then((m) => ({
    default: m.DataCatalogDetailRoute,
  })),
)
const DataCatalogVariantDetailRoute = lazy(() =>
  import('@/features/company-catalog/pages/DataCatalogRoutes').then((m) => ({
    default: m.DataCatalogVariantDetailRoute,
  })),
)
const DataCatalogAttributeDetailRoute = lazy(() =>
  import('@/features/company-catalog/pages/DataCatalogRoutes').then((m) => ({
    default: m.DataCatalogAttributeDetailRoute,
  })),
)
const DataLibraryCatchAllRoute = lazy(() =>
  import('@/features/company-catalog/pages/DataCatalogRoutes').then((m) => ({
    default: m.DataLibraryCatchAllRoute,
  })),
)

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const location = useLocation()
  if (!accessToken) {
    const returnPath = `${location.pathname}${location.search}`
    return <Navigate to={buildWebOnOneLoginHref(returnPath)} replace />
  }
  return children
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const selectionComplete = useAppSelector((s) => s.sessionRole.selectionComplete)
  if (!selectionComplete) {
    return null
  }
  if (activeRole !== 'super_admin') {
    return <Navigate to="/" replace />
  }
  return children
}

function AuthStorageSync() {
  useAuthStorageSync()
  return null
}

export function App() {
  return (
    <BrowserRouter>
      <AuthStorageSync />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<IdentityAuthPage />} />
        <Route path="/forgot-password" element={<IdentityAuthPage />} />
        <Route path="/verify-reset-otp" element={<IdentityAuthPage />} />
        <Route path="/reset-password" element={<IdentityAuthPage />} />
        <Route path="/callback" element={<AuthCallbackPage />} />
        <Route path="/auth/clear-session" element={<ClearSessionPage />} />
        <Route path="/auth/sso-bridge" element={<AuthSsoBridgePage />} />
        <Route path="/auth/handoff" element={<AuthHandoffPage />} />
        <Route
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route
            index
            element={
              <LazyRoute>
                <HomePage />
              </LazyRoute>
            }
          />
          <Route
            path="home"
            element={<Navigate to="/" replace />}
          />
          <Route
            path="analytics"
            element={
              <LazyRoute>
                <AnalyticsPage />
              </LazyRoute>
            }
          />
          <Route
            path="calendar"
            element={<Navigate to="/calendar/schedule" replace />}
          />
          <Route
            path="calendar/schedule"
            element={
              <LazyRoute>
                <CalendarPage />
              </LazyRoute>
            }
          />
          <Route
            path="calendar/events"
            element={
              <LazyRoute>
                <EventsPage />
              </LazyRoute>
            }
          />
          <Route
            path="calendar/events/:eventId"
            element={
              <LazyRoute>
                <EventDetailsPage />
              </LazyRoute>
            }
          />
          <Route
            path="calendar/events/:eventId/sessions/:occurrenceDate"
            element={
              <LazyRoute>
                <SessionDetailsPage />
              </LazyRoute>
            }
          />
          <Route
            path="companies"
            element={
              <SuperAdminRoute>
                <LazyRoute>
                  <CompaniesPage />
                </LazyRoute>
              </SuperAdminRoute>
            }
          />
          <Route
            path="companies/:companyId"
            element={
              <SuperAdminRoute>
                <LazyRoute>
                  <AdminCompanyProfilePage />
                </LazyRoute>
              </SuperAdminRoute>
            }
          />
          <Route
            path="settings/companies"
            element={
              <LazyRoute>
                <AllCompaniesPage />
              </LazyRoute>
            }
          />
          <Route
            path="settings/connected-companies"
            element={
              <LazyRoute>
                <ConnectedCompaniesPage />
              </LazyRoute>
            }
          />
          <Route
            path="settings/connected-companies/:companyId/catalog/:kind/:id"
            element={
              <LazyRoute>
                <MemberCompanyCatalogDetailPage />
              </LazyRoute>
            }
          />
          <Route
            path="settings/connected-companies/:companyId"
            element={
              <LazyRoute>
                <MemberCompanyProfilePage />
              </LazyRoute>
            }
          />
          <Route
            path="settings/companies/:companyId/catalog/:kind/:id"
            element={
              <LazyRoute>
                <MemberCompanyCatalogDetailPage />
              </LazyRoute>
            }
          />
          <Route
            path="settings/companies/:companyId"
            element={
              <LazyRoute>
                <MemberCompanyProfilePage />
              </LazyRoute>
            }
          />
          <Route
            path="settings/basic"
            element={
              <LazyRoute>
                <BasicSettingsPage />
              </LazyRoute>
            }
          />
          <Route
            path="settings/system-theme"
            element={
              <LazyRoute>
                <SystemThemePage />
              </LazyRoute>
            }
          />
          <Route
            path="settings/system-theme/:themeId"
            element={
              <LazyRoute>
                <ThemeDetailPage />
              </LazyRoute>
            }
          />
          <Route
            path="notifications"
            element={
              <LazyRoute>
                <NotificationsPage />
              </LazyRoute>
            }
          />
          <Route
            path="staff"
            element={
              <LazyRoute>
                <StaffPage />
              </LazyRoute>
            }
          />
          <Route
            path="staff/:staffId"
            element={
              <LazyRoute>
                <StaffDetailsPage />
              </LazyRoute>
            }
          />
          <Route
            path="staff/:staffId/history/tokens/:tokenId"
            element={
              <LazyRoute>
                <StaffHistoryTokenDetailPage />
              </LazyRoute>
            }
          />
          <Route
            path="staff/:staffId/history/submissions/:submissionId"
            element={
              <LazyRoute>
                <StaffHistorySubmissionDetailPage />
              </LazyRoute>
            }
          />
          <Route
            path="sales/pos"
            element={
              <LazyRoute>
                <PosPage />
              </LazyRoute>
            }
          />
          <Route
            path="sales"
            element={
              <LazyRoute>
                <SalesHistoryPage />
              </LazyRoute>
            }
          />
          <Route
            path="sales/:id"
            element={
              <LazyRoute>
                <SaleBillPage />
              </LazyRoute>
            }
          />
          <Route
            path="email/*"
            element={
              <LazyRoute>
                <PlatformPeerFrame peer="email" />
              </LazyRoute>
            }
          />
          <Route
            path="sms/*"
            element={
              <LazyRoute>
                <PlatformPeerFrame peer="sms" />
              </LazyRoute>
            }
          />
          <Route
            path="payment/*"
            element={
              <LazyRoute>
                <PlatformPeerFrame peer="payment" />
              </LazyRoute>
            }
          />
          <Route
            path="design/*"
            element={
              <LazyRoute>
                <PlatformPeerFrame peer="design" />
              </LazyRoute>
            }
          />
          <Route
            path="data/products/:productId/variants/:variantId"
            element={
              <LazyRoute>
                <DataCatalogVariantDetailRoute />
              </LazyRoute>
            }
          />
          <Route
            path="data/:kind/:entityId/attributes/:attributeId"
            element={
              <LazyRoute>
                <DataCatalogAttributeDetailRoute />
              </LazyRoute>
            }
          />
          <Route
            path="data/:kind/:id"
            element={
              <LazyRoute>
                <DataCatalogDetailRoute />
              </LazyRoute>
            }
          />
          <Route
            path="data/:kind"
            element={
              <LazyRoute>
                <DataCatalogListRoute />
              </LazyRoute>
            }
          />
          <Route
            path="data/*"
            element={
              <LazyRoute>
                <DataLibraryCatchAllRoute />
              </LazyRoute>
            }
          />
          <Route
            path="profile/*"
            element={
              <LazyRoute>
                <PlatformPeerFrame peer="identity" />
              </LazyRoute>
            }
          />
          <Route
            path="identity/*"
            element={
              <LazyRoute>
                <PlatformPeerFrame peer="identity" />
              </LazyRoute>
            }
          />
        </Route>
        <Route path="admin/companies/login" element={<Navigate to={buildWebOnOneLoginHref()} replace />} />
        <Route path="admin/companies/pending" element={<Navigate to="/companies" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
