import { normalizeRecipientForTextLk } from '../utils/phoneFormat.js'

const TEXT_LK_API_BASE = 'https://app.text.lk/api/v3'
const TEXT_LK_SEND_URL = `${TEXT_LK_API_BASE}/sms/send`
/** Confirmed via official textlk/textlk-php SDK `getBalance()`. */
const TEXT_LK_BALANCE_URL = `${TEXT_LK_API_BASE}/balance`
const TEXT_LK_BALANCE_TIMEOUT_MS = 15_000

export interface TextLkSendInput {
  apiToken: string
  senderId: string
  toNumber: string
  message: string
}

export type TextLkSendResult =
  | { ok: true; uid: string }
  | { ok: false; error: string; retryable: boolean }

export type TextLkBalanceResult =
  | { ok: true; balance: number }
  | { ok: false; error: string; retryable: boolean }

interface TextLkSuccessBody {
  status?: string | boolean
  message?: string
  data?: { uid?: string; status?: string }
}

interface TextLkErrorBody {
  status?: string | boolean
  message?: string
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.replace(/,/g, ''))
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

/** Text.lk / API-v3 gateways use string "error" or boolean false for failures. */
export function isTextLkErrorStatus(status: unknown): boolean {
  return status === 'error' || status === false
}

/**
 * Parse Text.lk balance JSON. Field names vary; prefer documented SDK shapes.
 * Live Text.lk (and sibling API-v3 gateways) expose `data.remaining_balance`.
 * Never invent a balance from missing data.
 */
export function parseTextLkBalanceBody(body: unknown): number | null {
  if (body == null || typeof body !== 'object') return null
  const root = body as Record<string, unknown>

  if (isTextLkErrorStatus(root.status)) return null

  const direct =
    asFiniteNumber(root.balance) ??
    asFiniteNumber(root.credits) ??
    asFiniteNumber(root.remaining_balance)
  if (direct != null) return direct

  const data = root.data
  if (typeof data === 'number' || typeof data === 'string') {
    return asFiniteNumber(data)
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    return (
      asFiniteNumber(record.remaining_balance) ??
      asFiniteNumber(record.available_balance) ??
      asFiniteNumber(record.balance) ??
      asFiniteNumber(record.credits) ??
      asFiniteNumber(record.credit) ??
      asFiniteNumber(record.sms_balance) ??
      asFiniteNumber(record.remaining)
    )
  }
  return null
}

/** Send one SMS via Text.lk OAuth Bearer API. */
export async function sendViaTextLk(input: TextLkSendInput): Promise<TextLkSendResult> {
  const recipient = normalizeRecipientForTextLk(input.toNumber)
  if (!recipient || recipient.length < 9) {
    return { ok: false, error: 'Invalid recipient number', retryable: false }
  }

  let response: Response
  try {
    response = await fetch(TEXT_LK_SEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.apiToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        recipient,
        sender_id: input.senderId,
        type: 'plain',
        message: input.message,
      }),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error'
    return { ok: false, error: `Text.lk network error: ${message}`, retryable: true }
  }

  let body: TextLkSuccessBody & TextLkErrorBody = {}
  try {
    body = (await response.json()) as TextLkSuccessBody & TextLkErrorBody
  } catch {
    body = {}
  }

  if (!response.ok || isTextLkErrorStatus(body.status)) {
    const error = body.message || `Text.lk HTTP ${response.status}`
    const retryable = response.status >= 500 || response.status === 429
    return { ok: false, error, retryable }
  }

  const uid = body.data?.uid
  if (!uid) {
    return { ok: false, error: body.message || 'Text.lk response missing uid', retryable: true }
  }

  return { ok: true, uid }
}

/** Fetch remaining SMS credits via Text.lk OAuth Bearer API. */
export async function fetchTextLkBalance(apiToken: string): Promise<TextLkBalanceResult> {
  if (!apiToken.trim()) {
    return { ok: false, error: 'Text.lk API token is missing', retryable: false }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TEXT_LK_BALANCE_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(TEXT_LK_BALANCE_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    })
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError'
    const message = aborted
      ? 'Text.lk balance request timed out'
      : `Text.lk network error: ${err instanceof Error ? err.message : 'Network error'}`
    return { ok: false, error: message, retryable: true }
  } finally {
    clearTimeout(timeout)
  }

  let body: unknown = {}
  try {
    body = await response.json()
  } catch {
    body = {}
  }

  const errorBody = body as TextLkErrorBody
  if (!response.ok || isTextLkErrorStatus(errorBody.status)) {
    const authRejected =
      response.status === 401 ||
      response.status === 403 ||
      /unauthenticated|unauthorized|credentials/i.test(errorBody.message ?? '')
    if (authRejected) {
      return {
        ok: false,
        error: errorBody.message || 'Text.lk credentials were rejected',
        retryable: false,
      }
    }
    const error = errorBody.message || `Text.lk HTTP ${response.status}`
    const retryable = response.status >= 500 || response.status === 429 || response.status === 408
    return { ok: false, error, retryable }
  }

  const balance = parseTextLkBalanceBody(body)
  if (balance == null) {
    return { ok: false, error: 'Text.lk balance response was malformed', retryable: true }
  }

  return { ok: true, balance }
}
