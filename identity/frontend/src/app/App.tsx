import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@webonone/ui-kit'
import { AppLayout } from '@/app/AppLayout'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { VerifyResetOtpPage } from '@/features/auth/pages/VerifyResetOtpPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import { ProfilePage } from '@/features/profile/pages/ProfilePage'

export function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/verify-reset-otp" element={<VerifyResetOtpPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
