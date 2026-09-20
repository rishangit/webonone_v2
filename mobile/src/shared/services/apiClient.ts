import { secureStorage } from './secureStorage'

export class ApiError extends Error {
  readonly code?: string
  readonly attemptsRemaining?: number

  constructor(message: string, extras?: { code?: string; attemptsRemaining?: number }) {
    super(message)
    this.name = 'ApiError'
    this.code = extras?.code
    this.attemptsRemaining = extras?.attemptsRemaining
  }
}

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
      `${reason}. Check that the API backend is running and reachable from this device (set PAYMENT_API_BASE_URL or PAYMENT_ORIGIN in mobile/.env; use your PC's LAN IP for local dev, not localhost).`,
    )
  }

  if (response.status === 401) {
    onUnauthorized?.()
    throw new Error('Session expired. Please sign in again.')
  }

  const text = await response.text()
  const data = parseJsonBody(text, `${baseUrl}${path}`, response.status) as {
    message?: unknown
    code?: unknown
    attemptsRemaining?: unknown
  } | null

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data && String(data.message)) ||
      `Request failed (${response.status})`
    const code =
      data && typeof data === 'object' && 'code' in data && typeof data.code === 'string'
        ? data.code
        : undefined
    const attemptsRemaining =
      data && typeof data === 'object' && typeof data.attemptsRemaining === 'number'
        ? data.attemptsRemaining
        : undefined
    throw new ApiError(message, { code, attemptsRemaining })
  }

  return data as T
}

function parseJsonBody(text: string, url: string, status: number): unknown {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    const looksHtml = text.trimStart().startsWith('<')
    throw new Error(
      looksHtml
        ? `API returned HTML instead of JSON (${status}) from ${url}. Check the service API base URL (use /api/v1, not the frontend origin).`
        : `Invalid JSON (${status}) from ${url}.`,
    )
  }
}

export function createApiClient(baseUrl: string) {
  return <T>(path: string, options?: RequestOptions) => request<T>(baseUrl, path, options)
}
