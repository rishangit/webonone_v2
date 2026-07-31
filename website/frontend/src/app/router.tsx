import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { WebsiteHomePage } from '@/features/website/pages/WebsiteHomePage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<WebsiteHomePage />} />
        <Route path="*" element={<WebsiteHomePage />} />
      </Routes>
    </BrowserRouter>
  )
}
