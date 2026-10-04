import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { SupportLayout } from '@/app/SupportLayout'
import { PrivateRoute } from '@/features/auth/components/PrivateRoute'
import { AuthCallbackPage } from '@/features/auth/pages/AuthCallbackPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { HomePage } from '@/features/docs/pages/HomePage'

const ArticlePage = lazy(async () => {
  const mod = await import('@/features/docs/pages/ArticlePage')
  return { default: mod.ArticlePage }
})

const SearchPage = lazy(async () => {
  const mod = await import('@/features/docs/pages/SearchPage')
  return { default: mod.SearchPage }
})

const FeedbackListPage = lazy(async () => {
  const mod = await import('@/features/feedback/pages/FeedbackListPage')
  return { default: mod.FeedbackListPage }
})

const FeedbackDetailPage = lazy(async () => {
  const mod = await import('@/features/feedback/pages/FeedbackDetailPage')
  return { default: mod.FeedbackDetailPage }
})

const FeedbackSpecDocPage = lazy(async () => {
  const mod = await import('@/features/feedback/pages/FeedbackSpecDocPage')
  return { default: mod.FeedbackSpecDocPage }
})

function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/callback" element={<AuthCallbackPage />} />
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
            <Route
              path="feedback"
              element={
                <PrivateRoute>
                  <LazyRoute>
                    <FeedbackListPage />
                  </LazyRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="feedback/:ticketNumber/docs/:fileName"
              element={
                <PrivateRoute>
                  <LazyRoute>
                    <FeedbackSpecDocPage />
                  </LazyRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="feedback/:ticketNumber"
              element={
                <PrivateRoute>
                  <LazyRoute>
                    <FeedbackDetailPage />
                  </LazyRoute>
                </PrivateRoute>
              }
            />
            <Route path="*" element={<HomePage />} />
          </Route>
        </Routes>
    </BrowserRouter>
  )
}
