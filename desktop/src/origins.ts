const LOCAL_FRONTEND_PORT_MIN = 3010
const LOCAL_FRONTEND_PORT_MAX = 3021

export function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function isDataUrl(url: string): boolean {
  try {
    return new URL(url).protocol === 'data:'
  } catch {
    return url.startsWith('data:')
  }
}

export function isLocalDevFrontend(url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }

  if (parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') {
    return false
  }

  const port = Number(parsed.port || (parsed.protocol === 'https:' ? 443 : 80))
  return port >= LOCAL_FRONTEND_PORT_MIN && port <= LOCAL_FRONTEND_PORT_MAX
}

export function isGoogleOAuthUrl(url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }

  const host = parsed.hostname
  return (
    host === 'accounts.google.com' ||
    host === 'google.com' ||
    host.endsWith('.google.com') ||
    host.endsWith('.googleusercontent.com')
  )
}

export function isAllowedMainFrameUrl(url: string, appUrl: string, isPackaged: boolean): boolean {
  if (isDataUrl(url)) {
    return true
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }

  let appOrigin: string
  try {
    appOrigin = new URL(appUrl).origin
  } catch {
    return false
  }

  if (parsed.origin === appOrigin) {
    return true
  }

  if (!isPackaged && isLocalDevFrontend(url)) {
    return true
  }

  return false
}

export function isAboutBlank(url: string): boolean {
  return url === 'about:blank' || url.startsWith('about:blank')
}
