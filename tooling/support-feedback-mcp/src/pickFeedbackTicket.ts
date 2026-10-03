import type { FeedbackReport } from './supportApi.js'
import { SupportFeedbackApi } from './supportApi.js'

function sortQueue(items: FeedbackReport[]): FeedbackReport[] {
  return [...items].sort((a, b) => {
    const created = a.createdAt.localeCompare(b.createdAt)
    if (created !== 0) return created
    return a.id.localeCompare(b.id)
  })
}

async function listAllByStatus(
  api: SupportFeedbackApi,
  status: 'ready_to_develop' | 'planned',
): Promise<FeedbackReport[]> {
  const items: FeedbackReport[] = []
  let page = 1
  for (;;) {
    const result = await api.listFeedback({ page, pageSize: 100, status })
    items.push(...result.items)
    if (!result.hasMore) break
    page += 1
  }
  return items
}

/** Same pick order as `.cursor/commands/feedback-fix.md` (queue mode). */
export async function pickFeedbackTicketForQueue(
  api: SupportFeedbackApi,
): Promise<FeedbackReport | null> {
  const ready = sortQueue(await listAllByStatus(api, 'ready_to_develop'))
  if (ready.length > 0) return ready[0]

  const planned = sortQueue(await listAllByStatus(api, 'planned'))
  if (planned.length > 0) return planned[0]

  return null
}
