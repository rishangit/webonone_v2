import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import {
  applyListDisplayModeFromQueryParams,
  applyListPageModeFromQueryParams,
  applyThemeFromQueryParams,
  applyUiTheme,
  applyUiThemeFromQueryParams,
  resolveUiTheme,
} from '@webonone/theme'
import '@webonone/ui-kit/styles'
import { ToastProvider } from '@webonone/ui-kit'
import { store } from '@/app/store'
import { App } from '@/app/router'
import { AiFieldAssistHost } from '@/features/ai/components/AiFieldAssistHost'
import { initSupportI18n } from '@/i18n'

const search = new URLSearchParams(window.location.search)
applyThemeFromQueryParams(search)
applyListPageModeFromQueryParams(search)
applyListDisplayModeFromQueryParams(search)
applyUiThemeFromQueryParams(search)
applyUiTheme(resolveUiTheme(search))
initSupportI18n()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ToastProvider>
        <AiFieldAssistHost>
          <App />
        </AiFieldAssistHost>
      </ToastProvider>
    </Provider>
  </StrictMode>,
)
