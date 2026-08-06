import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyThemeFromQueryParams } from '@webonone/theme'
import '@webonone/ui-kit/styles'
import { App } from '@/app/router'
import { initWebsiteI18n } from '@/i18n'

applyThemeFromQueryParams(new URLSearchParams(window.location.search))
initWebsiteI18n()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
