import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@webonone/ui-kit'
import { SupportLayout } from '@/app/SupportLayout'
import { HomePage } from '@/features/docs/pages/HomePage'

const ArticlePage = lazy(async () => {
  const mod = await import('@/features/docs/pages/ArticlePage')
  return { default: mod.ArticlePage }
})

const SearchPage = lazy(async () => {
  const mod = await import('@/features/docs/pages/SearchPage')
  return { default: mod.SearchPage }
})

function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>
}

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route element={<SupportLayout />}>
            <Route index element={<HomePage />} />
            <Route
              path="docs/:category/:slug"
              element={
                <LazyRoute>
                  <ArticlePage />
                </LazyRoute>
              }
            />
            <Route
              path="search"
              element={
                <LazyRoute>
                  <SearchPage />
                </LazyRoute>
              }
            />
            <Route path="*" element={<HomePage />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}
