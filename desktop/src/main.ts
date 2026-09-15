import {
  app,
  BrowserWindow,
  Menu,
  session,
  shell,
  ipcMain,
  type HandlerDetails,
} from 'electron'
import path from 'node:path'
import { getAppUrl, loadDotEnv } from './config'
import { getOfflineDataUrl } from './offlinePage'
import {
  isAboutBlank,
  isAllowedMainFrameUrl,
  isGoogleOAuthUrl,
  isHttpUrl,
} from './origins'

const PARTITION = 'persist:webonone'
const RETRY_CHANNEL = 'desktop:retry'

const NETWORK_FAIL_CODES = new Set([
  -2, -21, -100, -101, -102, -105, -106, -109, -118, -130, -137, -324, -501,
])

let mainWindow: BrowserWindow | null = null
let appUrl = ''

function popupWebPreferences(): Electron.BrowserWindowConstructorOptions['webPreferences'] {
  return {
    partition: PARTITION,
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    webviewTag: false,
  }
}

async function openExternalIfHttp(url: string): Promise<void> {
  if (isHttpUrl(url)) {
    await shell.openExternal(url)
  }
}

function handleWindowOpen(details: HandlerDetails): { action: 'allow' | 'deny'; overrideBrowserWindowOptions?: Electron.BrowserWindowConstructorOptions } {
  const url = details.url
  if (isAboutBlank(url) || isGoogleOAuthUrl(url) || isAllowedMainFrameUrl(url, appUrl, app.isPackaged)) {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        webPreferences: popupWebPreferences(),
      },
    }
  }

  void openExternalIfHttp(url)
  return { action: 'deny' }
}

function attachMainWindowGuards(contents: Electron.WebContents): void {
  contents.on('will-navigate', (event, url) => {
    if (isAllowedMainFrameUrl(url, appUrl, app.isPackaged)) {
      return
    }
    event.preventDefault()
    void openExternalIfHttp(url)
  })

  contents.on('did-fail-load', (_event, errorCode, _description, _validatedURL, isMainFrame) => {
    if (!isMainFrame) {
      return
    }
    if (errorCode === -3) {
      return
    }
    if (NETWORK_FAIL_CODES.has(errorCode)) {
      void contents.loadURL(getOfflineDataUrl())
    }
  })
}

function loadApp(): void {
  if (!mainWindow) {
    return
  }
  void mainWindow.loadURL(appUrl)
}

function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(app.isPackaged ? [] : [{ type: 'separator' as const }, { role: 'toggleDevTools' as const }]),
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'WebOnOne Help',
          click: () => {
            void shell.openExternal('https://support.webonone.com')
          },
        },
      ],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function configureSession(): void {
  const ses = session.fromPartition(PARTITION)

  ses.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'clipboard-sanitized-write' || permission === 'fullscreen')
  })

  ses.on('will-download', (_event, item) => {
    const filePath = path.join(app.getPath('downloads'), item.getFilename())
    item.setSavePath(filePath)
  })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    title: 'WebOnOne',
    show: false,
    autoHideMenuBar: false,
    webPreferences: popupWebPreferences(),
  })

  attachMainWindowGuards(mainWindow.webContents)

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  loadApp()
}

function registerIpc(): void {
  ipcMain.on(RETRY_CHANNEL, () => {
    loadApp()
  })
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) {
      return
    }
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    mainWindow.show()
    mainWindow.focus()
  })

  app.whenReady().then(() => {
    loadDotEnv()
    appUrl = getAppUrl()
    configureSession()
    createMenu()
    registerIpc()
    app.on('web-contents-created', (_event, contents) => {
      contents.setWindowOpenHandler((details) => handleWindowOpen(details))
    })
    createWindow()
  })

  app.on('window-all-closed', () => {
    app.quit()
  })
}
