import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AiFieldAssistProvider, ToastProvider } from '@webonone/ui-kit'
import { ShowcaseAuthCallbackPage } from '@/pages/ShowcaseAuthCallbackPage'
import { ShowcaseHome } from '../pages/ShowcaseHome'

async function mockPolish(input: { text: string }) {
  await new Promise((resolve) => window.setTimeout(resolve, 250))
  return input.text.replace(/\bteh\b/gi, 'the').replace(/\s+/g, ' ').trim()
}

export function App() {
  return (
    <ToastProvider>
      <AiFieldAssistProvider enabled polish={mockPolish}>
        <BrowserRouter>
          <Routes>
            <Route path="/callback" element={<ShowcaseAuthCallbackPage />} />
            <Route path="*" element={<ShowcaseHome />} />
          </Routes>
        </BrowserRouter>
      </AiFieldAssistProvider>
    </ToastProvider>
  )
}
