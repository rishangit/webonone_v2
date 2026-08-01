import { lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@webonone/ui-kit'
import { AppLayout } from '@/app/AppLayout'
import { LazyRoute } from '@/app/LazyRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { LogoutPage } from '@/features/auth/pages/LogoutPage'
import { SilentSsoPage } from '@/features/auth/pages/SilentSsoPage'

const RegisterPage = lazy(() =>
  import('@/features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
)
const ForgotPasswordPage = lazy(() =>
  import('@/features/auth/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
)
const VerifyResetOtpPage = lazy(() =>
  import('@/features/auth/pages/VerifyResetOtpPage').then((m) => ({
    default: m.VerifyResetOtpPage,
  })),
)
const ResetPasswordPage = lazy(() =>
  import('@/features/auth/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
)
const ProfilePage = lazy(() =>
  import('@/features/profile/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
)
const UserPickerPage = lazy(() =>
  import('@/features/users/pages/UserPickerPage').then((m) => ({ default: m.UserPickerPage })),
)
const UsersPage = lazy(() =>
  import('@/features/users/pages/UsersPage').then((m) => ({ default: m.UsersPage })),
)
const UserDetailsPage = lazy(() =>
  import('@/features/users/pages/UserDetailsPage').then((m) => ({ default: m.UserDetailsPage })),
)
const UserSelectionEmbedPage = lazy(() =>
  import('@/features/users/pages/UserSelectionEmbedPage').then((m) => ({
    default: m.UserSelectionEmbedPage,
  })),
)
const UserCreateEmbedPage = lazy(() =>
  import('@/features/users/pages/UserCreateEmbedPage').then((m) => ({
    default: m.UserCreateEmbedPage,
  })),
)
const ProfileFormEmbedPage = lazy(() =>
  import('@/features/profile/pages/ProfileFormEmbedPage').then((m) => ({
    default: m.ProfileFormEmbedPage,
  })),
)
const VerifyEmailEmbedPage = lazy(() =>
  import('@/features/profile/pages/VerifyContactEmbedPage').then((m) => ({
    default: () => <m.VerifyContactEmbedPage channel="email" />,
  })),
)
const VerifyPhoneEmbedPage = lazy(() =>
  import('@/features/profile/pages/VerifyContactEmbedPage').then((m) => ({
    default: () => <m.VerifyContactEmbedPage channel="phone" />,
  })),
)

export function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/logout" element={<LogoutPage />} />
            <Route path="/auth/silent-sso" element={<SilentSsoPage />} />
            <Route
              path="/register"
              element={
                <LazyRoute>
                  <RegisterPage />
                </LazyRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <LazyRoute>
                  <ForgotPasswordPage />
                </LazyRoute>
              }
            />
            <Route
              path="/verify-reset-otp"
              element={
                <LazyRoute>
                  <VerifyResetOtpPage />
                </LazyRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <LazyRoute>
                  <ResetPasswordPage />
                </LazyRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <LazyRoute>
                  <ProfilePage />
                </LazyRoute>
              }
            />
            <Route
              path="/user-picker"
              element={
                <LazyRoute>
                  <UserPickerPage />
                </LazyRoute>
              }
            />
            <Route
              path="/users"
              element={
                <LazyRoute>
                  <UsersPage />
                </LazyRoute>
              }
            />
            <Route
              path="/users/:id"
              element={
                <LazyRoute>
                  <UserDetailsPage />
                </LazyRoute>
              }
            />
            <Route
              path="/embed/dialogs/users/add"
              element={
                <LazyRoute>
                  <UserSelectionEmbedPage />
                </LazyRoute>
              }
            />
            <Route
              path="/embed/dialogs/users/create"
              element={
                <LazyRoute>
                  <UserCreateEmbedPage />
                </LazyRoute>
              }
            />
            <Route
              path="/embed/dialogs/profile/edit"
              element={
                <LazyRoute>
                  <ProfileFormEmbedPage />
                </LazyRoute>
              }
            />
            <Route
              path="/embed/dialogs/profile/verify-email"
              element={
                <LazyRoute>
                  <VerifyEmailEmbedPage />
                </LazyRoute>
              }
            />
            <Route
              path="/embed/dialogs/profile/verify-phone"
              element={
                <LazyRoute>
                  <VerifyPhoneEmbedPage />
                </LazyRoute>
              }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
