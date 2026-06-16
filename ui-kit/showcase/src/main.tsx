import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@webonone/ui-kit/styles'
import { App } from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
