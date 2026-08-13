import { env } from '../config/env.js'
import {
  getTextLkCredentials,
  listTextLkScopes,
} from '../services/gatewayConfig.service.js'
import { claimMessagesForProvider, reportProviderStatus } from '../services/queue.service.js'
import { sendViaTextLk } from '../services/textLkProvider.service.js'

const BATCH_SIZE = 5

let intervalHandle: ReturnType<typeof setInterval> | null = null
let running = false

async function processScope(scope: 'platform' | 'company', companyId: string | null) {
  let credentials
  try {
    credentials = await getTextLkCredentials(scope, companyId)
  } catch {
    return
  }

  const messages = await claimMessagesForProvider(scope, companyId, BATCH_SIZE)
  for (const message of messages) {
    const result = await sendViaTextLk({
      apiToken: credentials.apiToken,
      senderId: credentials.senderId,
      toNumber: message.toNumber,
      message: message.body,
    })

    if (result.ok) {
      await reportProviderStatus(message.id, {
        status: 'sent',
        providerMessageRef: result.uid,
      })
    } else {
      await reportProviderStatus(message.id, {
        status: 'failed',
        error: result.error,
      })
    }
  }
}

async function tick() {
  if (running) return
  running = true
  try {
    const scopes = await listTextLkScopes()
    for (const entry of scopes) {
      await processScope(entry.scope, entry.companyId)
    }
  } catch (err) {
    console.error('[providerWorker] tick error:', err)
  } finally {
    running = false
  }
}

export function startProviderWorker() {
  if (intervalHandle) return
  intervalHandle = setInterval(() => {
    void tick()
  }, env.queueWorkerIntervalMs)
  console.log(`[providerWorker] started (interval ${env.queueWorkerIntervalMs}ms)`)
}

export function stopProviderWorker() {
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
}
