import type { FeedbackStatus } from '../schemas/feedbackSchemas.js'
import { env } from '../config/env.js'

export type FeedbackStatusTriggerPayload = {
  ticketNumber: string
  status: FeedbackStatus
  fromStatus: FeedbackStatus
  id: string
  type: string
  title: string
}

function isConfigured(): boolean {
  return Boolean(env.feedbackFixTriggerUrl && env.feedbackFixTriggerSecret)
}

/**
 * Notify the localhost CLI listener that a feedback status changed.
 * Never throws — PATCH /status must succeed even if the listener is down.
 */
export async function triggerFeedbackStatusCommand(
  payload: FeedbackStatusTriggerPayload,
): Promise<void> {
  if (!isConfigured()) {
    return
  }

  try {
    const response = await fetch(env.feedbackFixTriggerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Feedback-Fix-Trigger-Secret': env.feedbackFixTriggerSecret,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(2000),
    })
    if (!response.ok) {
      const text = await response.text()
      console.error(`[feedbackFixTrigger] ${response.status}: ${text}`)
    }
  } catch (err) {
    console.error('[feedbackFixTrigger] listener unreachable:', err instanceof Error ? err.message : err)
  }
}

export function notifyFeedbackStatusChanged(payload: FeedbackStatusTriggerPayload): void {
  void triggerFeedbackStatusCommand(payload)
}
