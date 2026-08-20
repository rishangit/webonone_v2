import * as eventRepo from '../repositories/companyEvent.repository.js'
import * as sessionRunRepo from '../repositories/companyEventSessionRun.repository.js'
import { expandOccurrences, mapEventRow } from '../services/companyEvent.service.js'
import { notifySessionDueToStartInApp } from '../services/inAppNotify.service.js'

const INTERVAL_MS = 60_000
const DUE_WINDOW_MINUTES = 5

let timer: ReturnType<typeof setInterval> | null = null
let running = false

function todayYmd(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function normalizeTime(value: string | null | undefined): string | null {
  if (!value) return null
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim())
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  if (!Number.isFinite(h) || !Number.isFinite(m) || h > 23 || m > 59) return null
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export async function runSessionDueNotifyPass(): Promise<void> {
  if (running) return
  running = true
  try {
    const now = new Date()
    const today = todayYmd(now)
    const nowMinutes = now.getHours() * 60 + now.getMinutes()

    const rows = await eventRepo.listAllEvents()
    if (rows.length === 0) return

    const events = rows.map(mapEventRow)
    const due: Array<{
      companyId: string
      eventId: string
      occurrenceDate: string
      serviceName: string
      staffId: string
      startTime: string
    }> = []

    for (const event of events) {
      const occurrences = expandOccurrences(event, today, today)
      for (const occ of occurrences) {
        const run = await sessionRunRepo.findRunForSession(
          event.companyId,
          event.id,
          occ.occurrenceDate,
        )
        if (run?.status === 'started' || run?.status === 'ended') continue

        const startTime =
          normalizeTime(run?.scheduled_start_time ?? null) ??
          normalizeTime(occ.startTime) ??
          event.startTime
        const startMinutes = timeToMinutes(startTime)
        // Due when start is within next 5 minutes, or already past (same day) and not started.
        if (startMinutes > nowMinutes + DUE_WINDOW_MINUTES) continue

        due.push({
          companyId: event.companyId,
          eventId: event.id,
          occurrenceDate: occ.occurrenceDate,
          serviceName: event.serviceName,
          staffId: event.staffId,
          startTime,
        })
      }
    }

    await Promise.all(
      due.map((item) =>
        notifySessionDueToStartInApp(item).catch((err) => {
          console.error('[sessionDueNotify] notify failed:', err)
        }),
      ),
    )
  } catch (err) {
    console.error('[sessionDueNotify] pass failed:', err)
  } finally {
    running = false
  }
}

export function startSessionDueNotifyJob(): void {
  if (timer) return
  void runSessionDueNotifyPass()
  timer = setInterval(() => {
    void runSessionDueNotifyPass()
  }, INTERVAL_MS)
  if (typeof timer === 'object' && 'unref' in timer) {
    timer.unref()
  }
}
