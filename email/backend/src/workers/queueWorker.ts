import { env } from '../config/env.js'
import { getNextQueueItem, processQueueItem } from '../services/queue.service.js'
import { verifySmtpConnection } from '../services/mail.service.js'

let intervalHandle: ReturnType<typeof setInterval> | null = null
let processing = false

async function tick() {
  if (processing) return
  processing = true
  try {
    const item = await getNextQueueItem()
    if (item) {
      await processQueueItem(item)
    }
  } catch (err) {
    console.error('[queue-worker] tick error:', err)
  } finally {
    processing = false
  }
}

export function startQueueWorker() {
  if (intervalHandle) return

  void verifySmtpConnection()

  intervalHandle = setInterval(() => {
    void tick()
  }, env.queueWorkerIntervalMs)

  console.log(`[queue-worker] started (interval ${env.queueWorkerIntervalMs}ms)`)
}

export function stopQueueWorker() {
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
}
