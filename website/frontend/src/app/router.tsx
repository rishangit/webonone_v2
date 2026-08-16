import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@webonone/ui-kit'
import { WebsiteAuthBootstrap } from '@/features/auth/components/WebsiteAuthBootstrap'
import { WebsiteAuthProvider } from '@/features/auth/context/WebsiteAuthContext'
import { AuthSsoBridgePage } from '@/features/auth/pages/AuthSsoBridgePage'
import { ClearSessionPage } from '@/features/auth/pages/ClearSessionPage'
import { WebsiteLoginPage } from '@/features/auth/pages/WebsiteLoginPage'
import { WebsiteLayout } from '@/app/WebsiteLayout'
import { CatalogDetailPage } from '@/features/website/pages/CatalogDetailPage'
import { CatalogSearchPage } from '@/features/website/pages/CatalogSearchPage'
import { WebsiteHomePage } from '@/features/website/pages/WebsiteHomePage'

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <WebsiteAuthProvider>
          <WebsiteAuthBootstrap />
          <Routes>
            <Route element={<WebsiteLayout />}>
              <Route index element={<WebsiteHomePage />} />
              <Route path="search" element={<CatalogSearchPage />} />
              <Route path="catalog/:kind/:id" element={<CatalogDetailPage />} />
              <Route path="*" element={<WebsiteHomePage />} />
            </Route>
            <Route path="login" element={<WebsiteLoginPage />} />
            <Route path="auth/clear-session" element={<ClearSessionPage />} />
            <Route path="auth/sso-bridge" element={<AuthSsoBridgePage />} />
          </Routes>
        </WebsiteAuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
