import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'
import {
  resolveSessionTokenId,
  type CompanyActivityItem,
  type FormSubmissionItem,
  type UserHistoryItem,
} from '@/features/users/services/userHistoryApi'

export {
  buildDesignFormWebViewPath,
  getFormSubmissionDetail,
  getSessionTokenHistoryDetail,
  listSubmissionsForSessionToken,
  resolveSessionTokenId,
} from '@/features/users/services/userHistoryApi'

export type {
  FormSubmissionDetail,
  SessionTokenHistoryDetail,
  UserHistoryItem,
} from '@/features/users/services/userHistoryApi'

const webononeClient = createApiClient(env.webononeApiBaseUrl)
const designClient = createApiClient(env.designApiBaseUrl)

type ActivityRaw = {
  id: string
  type: CompanyActivityItem['type']
  title: string
  subtitle: string | null
  status: string | null
  occurredAt: string
  meta?: Record<string, unknown>
}

type SubmissionRaw = {
  id: string
  formName: string
  serviceName: string | null
  filledByDisplayName: string
  subjectDisplayName: string
  createdAt: string
  eventId?: string | null
  occurrenceDate?: string | null
  sessionTokenId?: string | null
}

function historyTime(item: UserHistoryItem): number {
  const iso = item.kind === 'form_submission' ? item.createdAt : item.occurredAt
  return new Date(iso).getTime()
}

function mergeStaffSessionHistory(
  formItems: FormSubmissionItem[],
  activityItems: CompanyActivityItem[],
): UserHistoryItem[] {
  const sessionItems = activityItems.filter((item) => item.type === 'session_token')
  const knownTokenIds = new Set(
    sessionItems
      .map((item) => resolveSessionTokenId(item))
      .filter((id): id is string => Boolean(id)),
  )

  const orphanForms: FormSubmissionItem[] = []
  const syntheticByToken = new Map<string, CompanyActivityItem>()

  for (const form of formItems) {
    const tokenId = form.sessionTokenId
    if (!tokenId) {
      orphanForms.push(form)
      continue
    }
    if (knownTokenIds.has(tokenId) || syntheticByToken.has(tokenId)) continue

    syntheticByToken.set(tokenId, {
      id: `token:${tokenId}`,
      type: 'session_token',
      title: form.serviceName || 'Event session',
      subtitle:
        [
          form.subjectDisplayName ? `Customer: ${form.subjectDisplayName}` : null,
          form.occurrenceDate ?? null,
        ]
          .filter(Boolean)
          .join(' · ') || null,
      status: null,
      occurredAt: form.createdAt,
      meta: {
        tokenId,
        eventId: form.eventId ?? null,
        occurrenceDate: form.occurrenceDate ?? null,
        serviceName: form.serviceName ?? null,
      },
      kind: 'company_activity',
    })
  }

  return [...sessionItems, ...syntheticByToken.values(), ...orphanForms].sort(
    (a, b) => historyTime(b) - historyTime(a),
  )
}

async function fetchSubmissionsByFiller(userId: string): Promise<SubmissionRaw[]> {
  const data = await designClient<{ items: SubmissionRaw[] }>(
    `/submissions?filledByUserId=${encodeURIComponent(userId)}&pageSize=50`,
  )
  return data.items ?? []
}

async function fetchActivity(userId: string): Promise<ActivityRaw[]> {
  const data = await webononeClient<{ items: ActivityRaw[] }>(
    `/company/me/users/${encodeURIComponent(userId)}/activity?pageSize=50`,
  )
  return data.items ?? []
}

export async function loadStaffHistory(userId: string): Promise<UserHistoryItem[]> {
  const [subs, activity] = await Promise.all([
    fetchSubmissionsByFiller(userId),
    fetchActivity(userId),
  ])

  const formItems: FormSubmissionItem[] = subs.map((item) => ({
    ...item,
    kind: 'form_submission' as const,
  }))
  const activityItems: CompanyActivityItem[] = activity
    .filter(
      (item): item is ActivityRaw & { type: CompanyActivityItem['type'] } =>
        item.type === 'session_token' ||
        item.type === 'event_attendee' ||
        item.type === 'event_staff',
    )
    .map((item) => ({
      ...item,
      kind: 'company_activity' as const,
    }))

  return mergeStaffSessionHistory(formItems, activityItems)
}
