import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { ensurePlatformEmbedCanvas } from '@webonone/platform-embed'
import { applyListPageModeFromQueryParams, applyThemeFromQueryParams, applyThemeVariables, applyUiTheme, applyUiThemeFromQueryParams, readPersistedTheme, resolveUiTheme } from '@webonone/theme'
import '@webonone/ui-kit/styles'
import { store } from '@/app/store'
import { App } from '@/app/router'
import { initDesignI18n } from '@/i18n'

ensurePlatformEmbedCanvas()
const search = new URLSearchParams(window.location.search)
if (!applyThemeFromQueryParams(search)) {
  const persisted = readPersistedTheme()
  if (persisted) applyThemeVariables(persisted)
}
applyListPageModeFromQueryParams(search)
applyUiThemeFromQueryParams(search)
applyUiTheme(resolveUiTheme(search))
initDesignI18n()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
