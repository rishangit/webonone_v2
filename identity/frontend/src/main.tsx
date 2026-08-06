import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { ensurePlatformEmbedCanvas } from '@webonone/platform-embed'
import { applyThemeFromQueryParams } from '@webonone/theme'
import '@webonone/ui-kit/styles'
import { store } from '@/app/store'
import { Root } from '@/app/Root'
import { initIdentityI18n } from '@/i18n'

ensurePlatformEmbedCanvas()
applyThemeFromQueryParams(new URLSearchParams(window.location.search))
initIdentityI18n()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <Root />
    </Provider>
  </StrictMode>,
)
