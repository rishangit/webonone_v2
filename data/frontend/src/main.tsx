import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { ensurePlatformEmbedCanvas } from '@webonone/platform-embed'
import { applyListPageModeFromQueryParams, applyThemeFromQueryParams, applyUiTheme, applyUiThemeFromQueryParams, resolveUiTheme } from '@webonone/theme'
import { ToastProvider } from '@webonone/ui-kit'
import '@webonone/ui-kit/styles'
import { store } from '@/app/store'
import { App } from '@/app/router'
import { initDataI18n } from '@/i18n'

ensurePlatformEmbedCanvas()
const search = new URLSearchParams(window.location.search)
applyThemeFromQueryParams(search)
applyListPageModeFromQueryParams(search)
applyUiThemeFromQueryParams(search)
applyUiTheme(resolveUiTheme(search))
initDataI18n()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </Provider>
  </StrictMode>,
)
