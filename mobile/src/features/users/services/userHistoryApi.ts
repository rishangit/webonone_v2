import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'

const webononeClient = createApiClient(env.webononeApiBaseUrl)
const designClient = createApiClient(env.designApiBaseUrl)

export type FormSubmissionItem = {
  id: string
  companyId?: string
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
  type: 'session_token' | 'event_attendee' | 'event_staff' | 'sale'
  title: string
  subtitle: string | null
  status: string | null
  occurredAt: string
  meta?: Record<string, unknown>
  kind: 'company_activity'
}

export type UserHistoryItem = FormSubmissionItem | CompanyActivityItem

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
  companyId?: string
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

export function resolveSessionTokenId(item: CompanyActivityItem): string | null {
  if (item.type !== 'session_token') return null
  const fromMeta = item.meta?.tokenId
  if (typeof fromMeta === 'string' && fromMeta.length === 21) return fromMeta
  if (item.id.startsWith('token:')) return item.id.slice('token:'.length)
  return null
}

export function resolveSaleId(item: CompanyActivityItem): string | null {
  if (item.type !== 'sale') return null
  const fromMeta = item.meta?.saleId
  if (typeof fromMeta === 'string' && fromMeta.length === 21) return fromMeta
  if (item.id.startsWith('sale:')) return item.id.slice('sale:'.length)
  return null
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

export type SaleHistoryDetail = {
  id: string
  billNumber: string
  customerUserId: string
  customerDisplayName: string
  customerEmail: string | null
  status: string
  paymentMethod: string
  currency: string
  subtotal: number
  total: number
  notes: string | null
  createdAt: string
  lines: Array<{
    id: string
    lineNo: number
    itemKind: string
    name: string
    quantity: number
    unitPrice: number
    lineTotal: number
  }>
}

export type DesignFormDialogMode = 'fill' | 'view'

export type DesignFormDialogSubject = {
  formTemplateId: string
  subjectUserId: string
  subjectDisplayName: string
  subjectEmail?: string | null
  serviceId?: string | null
  serviceName?: string | null
  eventId?: string | null
  occurrenceDate?: string | null
  sessionTokenId?: string | null
  mode?: DesignFormDialogMode
  submissionId?: string | null
}

function designFormQueryParams(query: DesignFormDialogSubject): URLSearchParams {
  const params = new URLSearchParams()
  params.set('subjectUserId', query.subjectUserId)
  params.set('subjectDisplayName', query.subjectDisplayName)
  if (query.subjectEmail) params.set('subjectEmail', query.subjectEmail)
  if (query.serviceId) params.set('serviceId', query.serviceId)
  if (query.serviceName) params.set('serviceName', query.serviceName)
  if (query.eventId) params.set('eventId', query.eventId)
  if (query.occurrenceDate) params.set('occurrenceDate', query.occurrenceDate)
  if (query.sessionTokenId) params.set('sessionTokenId', query.sessionTokenId)
  if (query.mode === 'view') params.set('mode', 'view')
  if (query.submissionId) params.set('submissionId', query.submissionId)
  return params
}

/** Native Design form fill/view path (Expo static route). */
export function buildDesignFormWebViewPath(subject: DesignFormDialogSubject): string {
  return `/design/forms/${encodeURIComponent(subject.formTemplateId)}/fill?${designFormQueryParams(subject).toString()}`
}

export async function getSessionTokenHistoryDetail(
  tokenId: string,
): Promise<SessionTokenHistoryDetail> {
  const data = await webononeClient<{ detail: SessionTokenHistoryDetail }>(
    `/company/me/session-tokens/${encodeURIComponent(tokenId)}`,
  )
  return data.detail
}

export async function listSubmissionsForSessionToken(
  sessionTokenId: string,
): Promise<FormSubmissionDetail[]> {
  const data = await designClient<{ items: FormSubmissionDetail[] }>(
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
  const data = await designClient<{ submission: FormSubmissionDetail }>(
    `/submissions/${encodeURIComponent(id)}`,
  )
  return data.submission
}

export async function getSaleHistoryDetail(saleId: string): Promise<SaleHistoryDetail> {
  return webononeClient<SaleHistoryDetail>(`/company/me/sales/${encodeURIComponent(saleId)}`)
}

export function mergeSessionHistory(
  formItems: FormSubmissionItem[],
  activityItems: CompanyActivityItem[],
): UserHistoryItem[] {
  const sessionItems = activityItems.filter((item) => item.type === 'session_token')
  const saleItems = activityItems.filter((item) => item.type === 'sale')
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

  return [...sessionItems, ...saleItems, ...syntheticByToken.values(), ...orphanForms].sort(
    (a, b) => historyTime(b) - historyTime(a),
  )
}

function settledValue<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback
}

function firstRejectedReason(results: PromiseSettledResult<unknown>[]): unknown {
  const rejected = results.find(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  )
  return rejected?.reason
}

async function fetchSubmissions(query: string): Promise<SubmissionRaw[]> {
  const data = await designClient<{ items: SubmissionRaw[] }>(
    `/submissions?${query}&pageSize=50`,
  )
  return data.items ?? []
}

async function fetchActivity(userId: string): Promise<ActivityRaw[]> {
  const data = await webononeClient<{ items: ActivityRaw[] }>(
    `/company/me/users/${encodeURIComponent(userId)}/activity?pageSize=50`,
  )
  return data.items ?? []
}

function toFormItems(rows: SubmissionRaw[]): FormSubmissionItem[] {
  const byId = new Map<string, FormSubmissionItem>()
  for (const item of rows) {
    byId.set(item.id, { ...item, kind: 'form_submission' })
  }
  return [...byId.values()]
}

function toActivityItems(rows: ActivityRaw[]): CompanyActivityItem[] {
  return rows.map((item) => ({
    ...item,
    kind: 'company_activity' as const,
  }))
}

export async function loadCustomerHistory(userId: string): Promise<UserHistoryItem[]> {
  const [subsResult, activityResult] = await Promise.allSettled([
    fetchSubmissions(`subjectUserId=${encodeURIComponent(userId)}`),
    fetchActivity(userId),
  ])
  if (subsResult.status === 'rejected' && activityResult.status === 'rejected') {
    const reason = firstRejectedReason([subsResult, activityResult])
    throw reason instanceof Error ? reason : new Error('Request failed')
  }

  return mergeSessionHistory(
    toFormItems(settledValue(subsResult, [])),
    toActivityItems(settledValue(activityResult, [])),
  )
}

export async function loadUserHistory(userId: string): Promise<UserHistoryItem[]> {
  const [asSubject, asFiller, activityResult] = await Promise.allSettled([
    fetchSubmissions(`subjectUserId=${encodeURIComponent(userId)}`),
    fetchSubmissions(`filledByUserId=${encodeURIComponent(userId)}`),
    fetchActivity(userId),
  ])
  if (
    asSubject.status === 'rejected' &&
    asFiller.status === 'rejected' &&
    activityResult.status === 'rejected'
  ) {
    const reason = firstRejectedReason([asSubject, asFiller, activityResult])
    throw reason instanceof Error ? reason : new Error('Request failed')
  }

  return mergeSessionHistory(
    toFormItems([...settledValue(asSubject, []), ...settledValue(asFiller, [])]),
    toActivityItems(settledValue(activityResult, [])),
  )
}
