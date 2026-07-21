import Constants from 'expo-constants'

interface MobileEnv {
  identityApiBaseUrl: string
  smsApiBaseUrl: string
}

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<MobileEnv>

/** Normalize to a full API base URL ending in `/api/v1` (no trailing slash). */
function normalizeApiBaseUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, '')
  if (trimmed.endsWith('/api/v1')) return trimmed
  return `${trimmed}/api/v1`
}

/**
 * When running in Expo Go on a physical device, `localhost` in env points at the
 * phone — rewrite it to the Metro bundler's LAN host (same machine as the APIs).
 */
function rewriteLocalhostForDevice(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
      return url
    }

    const hostUri =
      Constants.expoConfig?.hostUri ??
      (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost

    const lanHost = hostUri?.split(':')[0]
    if (!lanHost || lanHost === 'localhost' || lanHost === '127.0.0.1') {
      return url
    }

    parsed.hostname = lanHost
    return parsed.toString().replace(/\/$/, '')
  } catch {
    return url
  }
}

function resolveApiBaseUrl(value: string | undefined, fallback: string): string {
  const normalized = normalizeApiBaseUrl(value?.trim() || fallback)
  return rewriteLocalhostForDevice(normalized)
}

export const env: MobileEnv = {
  identityApiBaseUrl: resolveApiBaseUrl(extra.identityApiBaseUrl, 'http://localhost:4011/api/v1'),
  smsApiBaseUrl: resolveApiBaseUrl(extra.smsApiBaseUrl, 'http://localhost:4016/api/v1'),
}
