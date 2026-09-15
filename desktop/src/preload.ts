import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('webononeDesktop', {
  retry: () => {
    ipcRenderer.send('desktop:retry')
  },
})
