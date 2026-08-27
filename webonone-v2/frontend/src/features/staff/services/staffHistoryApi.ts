import { apiClient, getAccessToken } from '@/shared/services/apiClient'
import { getDesignApiBaseUrl } from '@/features/design/utils/designConfig'

export type FormSubmissionItem = {
  id: string
  formName: string
  serviceName: string | null
  filledByDisplayName: string
  subjectDisplayName: string
  createdAt: string
  eventId?: string | null
  occurrenceDate?: string | null
  sessionTokenId?: string | null
  kind: 'form_submission'
}

export type CompanyActivityItem = {
  id: string
  type: 'session_token' | 'event_attendee' | 'event_staff'
  title: string
  subtitle: string | null
  status: string | null
  occurredAt: string
  meta?: Record<string, unknown>
  kind: 'company_activity'
}

export type UserHistoryItem = FormSubmissionItem | CompanyActivityItem

export type SessionTokenHistoryDetail = {
  tokenId: string
  tokenNumber: number
  tokenLabel: string
  status: string
  userId: string
  userDisplayName: string
  userEmail: string | null
  eventId: string
  occurrenceDate: string
  serviceId: string
  serviceName: string
  formTemplateId: string | null
  timeMode: 'duration' | 'window'
  startTime: string
  endTime: string
  spaceId: string | null
  spaceName: string | null
  staffId: string
  staffDisplayName: string
  createdAt: string
  workflowProgress?: {
    steps: { id: string; label: string; kind: 'check_in' | 'space' | 'done' }[]
    currentIndex: number
    done: boolean
  }
  sales: SessionTokenHistorySale[]
}

export type SessionTokenHistorySale = {
  id: string
  billNumber: string
  total: number
  currency: string
  status: string
  paymentMethod: string
  createdAt: string
}

export type FormSubmissionDetail = {
  id: string
  formTemplateId: string
  formName: string
  subjectUserId: string
  subjectDisplayName: string
  subjectEmail: string | null
  filledByUserId: string
  filledByDisplayName: string
  serviceId: string | null
  serviceName: string | null
  eventId: string | null
  occurrenceDate: string | null
  sessionTokenId: string | null
  answers: Record<string, unknown>
  createdAt: string
}

function historyTime(item: UserHistoryItem): number {
  const iso = item.kind === 'form_submission' ? item.createdAt : item.occurredAt
  return new Date(iso).getTime()
}

/**
 * One history row per event session (token). Form fills with a sessionTokenId are nested
 * under that session detail — not listed as separate history rows.
 */
export function mergeSessionHistory(
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
      subtitle: [
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

async function designFetchSubmissions(filledByUserId: string) {
  const token = getAccessToken()
  const res = await fetch(
    `${getDesignApiBaseUrl().replace(/\/$/, '')}/submissions?filledByUserId=${encodeURIComponent(filledByUserId)}&pageSize=50`,
    {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        Accept: 'application/json',
      },
    },
  )
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { message?: string }).message ?? 'Failed to load submissions')
  }
  return data as {
    items: Array<{
      id: string
      formName: string
      serviceName: string | null
      filledByDisplayName: string
      subjectDisplayName: string
      createdAt: string
      eventId?: string | null
      occurrenceDate?: string | null
      sessionTokenId?: string | null
    }>
  }
}

async function designFetch<T>(path: string): Promise<T> {
  const token = getAccessToken()
  const res = await fetch(`${getDesignApiBaseUrl().replace(/\/$/, '')}${path}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      Accept: 'application/json',
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { message?: string }).message ?? 'Design API request failed')
  }
  return data as T
}

export async function loadStaffHistory(userId: string): Promise<UserHistoryItem[]> {
  const [subs, activity] = await Promise.all([
    designFetchSubmissions(userId),
    apiClient<{
      items: Array<{
        id: string
        type: 'session_token' | 'event_attendee' | 'event_staff' | 'sale'
        title: string
        subtitle: string | null
        status: string | null
        occurredAt: string
        meta?: Record<string, unknown>
      }>
    }>(`/company/me/users/${encodeURIComponent(userId)}/activity?pageSize=50`),
  ])

  const formItems: FormSubmissionItem[] = (subs.items ?? []).map((item) => ({
    ...item,
    kind: 'form_submission' as const,
  }))
  const activityItems: CompanyActivityItem[] = (activity.items ?? [])
    .filter(
      (item): item is typeof item & { type: CompanyActivityItem['type'] } =>
        item.type === 'session_token' ||
        item.type === 'event_attendee' ||
        item.type === 'event_staff',
    )
    .map((item) => ({
      ...item,
      kind: 'company_activity' as const,
    }))

  return mergeSessionHistory(formItems, activityItems)
}

export async function getSessionTokenHistoryDetail(
  tokenId: string,
): Promise<SessionTokenHistoryDetail> {
  const data = await apiClient<{ detail: SessionTokenHistoryDetail }>(
    `/company/me/session-tokens/${encodeURIComponent(tokenId)}`,
  )
  return data.detail
}

export async function listSubmissionsForSessionToken(
  sessionTokenId: string,
): Promise<FormSubmissionDetail[]> {
  const data = await designFetch<{ items: FormSubmissionDetail[] }>(
    `/submissions?sessionTokenId=${encodeURIComponent(sessionTokenId)}&pageSize=50`,
  )
  const byForm = new Map<string, FormSubmissionDetail>()
  for (const item of data.items ?? []) {
    const existing = byForm.get(item.formTemplateId)
    if (!existing || new Date(item.createdAt) > new Date(existing.createdAt)) {
      byForm.set(item.formTemplateId, item)
    }
  }
  return [...byForm.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export async function getFormSubmissionDetail(id: string): Promise<FormSubmissionDetail> {
  const data = await designFetch<{ submission: FormSubmissionDetail }>(
    `/submissions/${encodeURIComponent(id)}`,
  )
  return data.submission
}

export function resolveSessionTokenId(item: CompanyActivityItem): string | null {
  if (item.type !== 'session_token') return null
  const fromMeta = item.meta?.tokenId
  if (typeof fromMeta === 'string' && fromMeta.length === 21) return fromMeta
  if (item.id.startsWith('token:')) return item.id.slice('token:'.length)
  return null
}
