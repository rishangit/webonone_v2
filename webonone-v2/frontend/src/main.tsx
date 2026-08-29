import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { applyListPageModeFromQueryParams, applyThemeFromQueryParams, applyUiTheme, applyUiThemeFromQueryParams, resolveUiTheme } from '@webonone/theme'
import { ToastProvider } from '@webonone/ui-kit'
import '@webonone/ui-kit/styles'
import { store } from '@/app/store'
import { App } from '@/app/router'
import { initWebOnOneI18n } from '@/i18n'

const bootstrapSearch = new URLSearchParams(window.location.search)
applyThemeFromQueryParams(bootstrapSearch)
applyListPageModeFromQueryParams(bootstrapSearch)
applyUiThemeFromQueryParams(bootstrapSearch)
applyUiTheme(resolveUiTheme(bootstrapSearch))
initWebOnOneI18n()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </Provider>
  </StrictMode>,
)
