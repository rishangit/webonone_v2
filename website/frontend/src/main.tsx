import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyThemeFromQueryParams } from '@webonone/theme'
import '@webonone/ui-kit/styles'
import { App } from '@/app/router'

applyThemeFromQueryParams(new URLSearchParams(window.location.search))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
