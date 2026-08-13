import { normalizeRecipientForTextLk } from '../utils/phoneFormat.js'

const TEXT_LK_SEND_URL = 'https://app.text.lk/api/v3/sms/send'

export interface TextLkSendInput {
  apiToken: string
  senderId: string
  toNumber: string
  message: string
}

export type TextLkSendResult =
  | { ok: true; uid: string }
  | { ok: false; error: string; retryable: boolean }

interface TextLkSuccessBody {
  status?: string
  message?: string
  data?: { uid?: string; status?: string }
}

interface TextLkErrorBody {
  status?: string
  message?: string
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

  if (!response.ok || body.status === 'error') {
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
