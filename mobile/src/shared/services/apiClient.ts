import { secureStorage } from './secureStorage'

type UnauthorizedHandler = () => void

let onUnauthorized: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  /** Bearer token to use instead of the stored access token (e.g. device key auth). */
  bearer?: string | null
  /** Extra headers merged after auth (e.g. X-Sms-Device-Key). */
  extraHeaders?: Record<string, string>
}

async function request<T>(baseUrl: string, path: string, options: RequestOptions = {}): Promise<T> {
  const { body, bearer, extraHeaders, headers, ...rest } = options

  const token = bearer === undefined ? await secureStorage.getAccessToken() : bearer

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers as Record<string, string> | undefined),
    ...extraHeaders,
  }

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Network request failed'
    throw new Error(
      `${reason}. Check that Identity/SMS backends are running and reachable from this device (use your PC's LAN IP in mobile/.env, not localhost).`,
    )
  }

  if (response.status === 401) {
    onUnauthorized?.()
    throw new Error('Session expired. Please sign in again.')
  }

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data && String(data.message)) ||
      `Request failed (${response.status})`
    throw new Error(message)
  }

  return data as T
}

export function createApiClient(baseUrl: string) {
  return <T>(path: string, options?: RequestOptions) => request<T>(baseUrl, path, options)
}
