import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { applyThemeFromQueryParams } from '@webonone/theme'
import '@webonone/ui-kit/styles'
import { ToastProvider } from '@webonone/ui-kit'
import { store } from '@/app/store'
import { App } from '@/app/router'
import { initSupportI18n } from '@/i18n'

applyThemeFromQueryParams(new URLSearchParams(window.location.search))
initSupportI18n()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </Provider>
  </StrictMode>,
)
