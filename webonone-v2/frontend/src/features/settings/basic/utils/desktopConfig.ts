const DESKTOP_INSTALLER_FILENAME = 'WebOnOne-Setup.exe'
const DESKTOP_INSTALLER_PATH = `/downloads/${DESKTOP_INSTALLER_FILENAME}`

export function getDesktopInstallerFilename(): string {
  return DESKTOP_INSTALLER_FILENAME
}

export function getDesktopInstallerUrl(): string {
  const fromEnv = import.meta.env.VITE_DESKTOP_INSTALLER_URL?.trim()
  if (fromEnv) {
    return fromEnv
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${DESKTOP_INSTALLER_PATH}`
  }
  return DESKTOP_INSTALLER_PATH
}
