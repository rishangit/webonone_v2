import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@webonone/ui-kit'
import { WebsiteAuthBootstrap } from '@/features/auth/components/WebsiteAuthBootstrap'
import { WebsiteAuthProvider } from '@/features/auth/context/WebsiteAuthContext'
import { ClearSessionPage } from '@/features/auth/pages/ClearSessionPage'
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
            <Route index element={<WebsiteHomePage />} />
            <Route path="search" element={<CatalogSearchPage />} />
            <Route path="catalog/:kind/:id" element={<CatalogDetailPage />} />
            <Route path="auth/clear-session" element={<ClearSessionPage />} />
            <Route path="*" element={<WebsiteHomePage />} />
          </Routes>
        </WebsiteAuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
