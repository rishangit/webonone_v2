import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { applyListPageModeFromQueryParams, applyThemeFromQueryParams, applyUiTheme, applyUiThemeFromQueryParams, resolveUiTheme } from '@webonone/theme'
import '@webonone/ui-kit/styles'
import { store } from '@/app/store'
import { App } from '@/app/router'
import { initMediaI18n } from '@/i18n'

const search = new URLSearchParams(window.location.search)
applyThemeFromQueryParams(search)
applyListPageModeFromQueryParams(search)
applyUiThemeFromQueryParams(search)
applyUiTheme(resolveUiTheme(search))
initMediaI18n()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
