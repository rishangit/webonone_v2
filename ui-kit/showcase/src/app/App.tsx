import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@webonone/ui-kit'
import { ShowcaseAuthCallbackPage } from '@/pages/ShowcaseAuthCallbackPage'
import { ShowcaseHome } from '../pages/ShowcaseHome'

export function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/callback" element={<ShowcaseAuthCallbackPage />} />
          <Route path="*" element={<ShowcaseHome />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
