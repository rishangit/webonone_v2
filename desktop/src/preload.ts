import { contextBridge, ipcRenderer } from 'electron'
import pkg from '../package.json'

function formatDesktopVersionLabel(version: string): string {
  const trimmed = version.trim()
  if (!trimmed) return 'v0.0.0'
  return trimmed.startsWith('v') ? trimmed : `v${trimmed}`
}

contextBridge.exposeInMainWorld('webononeDesktop', {
  retry: () => {
    ipcRenderer.send('desktop:retry')
  },
  appVersion: formatDesktopVersionLabel(pkg.version),
})
