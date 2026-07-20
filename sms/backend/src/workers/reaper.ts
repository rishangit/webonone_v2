import { env } from '../config/env.js'
import { purgeExpiredOtps } from '../services/otp.service.js'
import { requeueStuckProcessing } from '../services/queue.service.js'

let intervalHandle: ReturnType<typeof setInterval> | null = null
let running = false

async function tick() {
  if (running) return
  running = true
  try {
    const requeued = await requeueStuckProcessing(env.processingTimeoutMs)
    if (requeued > 0) {
      console.log(`[reaper] re-queued ${requeued} stuck message(s)`)
    }
    await purgeExpiredOtps()
  } catch (err) {
    console.error('[reaper] tick error:', err)
  } finally {
    running = false
  }
}

export function startReaper() {
  if (intervalHandle) return
  intervalHandle = setInterval(() => {
    void tick()
  }, env.queueWorkerIntervalMs)
  console.log(`[reaper] started (interval ${env.queueWorkerIntervalMs}ms)`)
}

export function stopReaper() {
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
}
