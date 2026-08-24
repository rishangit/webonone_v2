import { getAccessToken } from '@/shared/services/apiClient'

const DEFAULT_DESIGN_API = 'http://127.0.0.1:4019/api/v1'
const DEFAULT_WEBONONE_API = 'http://127.0.0.1:4010/api/v1'

function getDesignApiBase(): string {
  return import.meta.env.VITE_DESIGN_API_BASE_URL ?? DEFAULT_DESIGN_API
}

function getWebOnOneApiBase(): string {
  return import.meta.env.VITE_WEBONONE_API_BASE_URL ?? DEFAULT_WEBONONE_API
}

async function peerFetch<T>(baseUrl: string, path: string): Promise<T> {
  const token = getAccessToken()
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      Accept: 'application/json',
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { message?: string }).message ?? 'Request failed')
  }
  return data as T
}

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
  type: 'session_token' | 'event_attendee' | 'event_staff' | 'sale'
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

type ActivityRaw = {
  id: string
  type: 'session_token' | 'event_attendee' | 'event_staff' | 'sale'
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

/**
 * One history row per event session (token). Form fills with a sessionTokenId are nested
 * under that session detail — not listed as separate history rows.
 * Orphan form fills (no session) stay as standalone rows.
 */
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

  return [...sessionItems, ...saleItems, ...syntheticByToken.values(), ...orphanForms].sort(
    (a, b) => historyTime(b) - historyTime(a),
  )
}

async function fetchSubmissions(query: string): Promise<SubmissionRaw[]> {
  const data = await peerFetch<{ items: SubmissionRaw[] }>(
    getDesignApiBase(),
    `/submissions?${query}&pageSize=50`,
  )
  return data.items ?? []
}

async function fetchActivity(userId: string): Promise<ActivityRaw[]> {
  const data = await peerFetch<{ items: ActivityRaw[] }>(
    getWebOnOneApiBase(),
    `/company/me/users/${encodeURIComponent(userId)}/activity?pageSize=50`,
  )
  return data.items ?? []
}

export async function loadCustomerHistory(userId: string): Promise<UserHistoryItem[]> {
  const [subs, activity] = await Promise.all([
    fetchSubmissions(`subjectUserId=${encodeURIComponent(userId)}`),
    fetchActivity(userId),
  ])

  const formItems: FormSubmissionItem[] = subs.map((item) => ({
    ...item,
    kind: 'form_submission' as const,
  }))
  const activityItems: CompanyActivityItem[] = activity.map((item) => ({
    ...item,
    kind: 'company_activity' as const,
  }))

  return mergeSessionHistory(formItems, activityItems)
}

export async function loadStaffHistory(userId: string): Promise<UserHistoryItem[]> {
  const [subs, activity] = await Promise.all([
    fetchSubmissions(`filledByUserId=${encodeURIComponent(userId)}`),
    fetchActivity(userId),
  ])

  const formItems: FormSubmissionItem[] = subs.map((item) => ({
    ...item,
    kind: 'form_submission' as const,
  }))
  const activityItems: CompanyActivityItem[] = activity.map((item) => ({
    ...item,
    kind: 'company_activity' as const,
  }))

  return mergeSessionHistory(formItems, activityItems)
}

export async function getSessionTokenHistoryDetail(
  tokenId: string,
): Promise<SessionTokenHistoryDetail> {
  const data = await peerFetch<{ detail: SessionTokenHistoryDetail }>(
    getWebOnOneApiBase(),
    `/company/me/session-tokens/${encodeURIComponent(tokenId)}`,
  )
  return data.detail
}

export async function listSubmissionsForSessionToken(
  sessionTokenId: string,
): Promise<FormSubmissionDetail[]> {
  const data = await peerFetch<{ items: FormSubmissionDetail[] }>(
    getDesignApiBase(),
    `/submissions?sessionTokenId=${encodeURIComponent(sessionTokenId)}&pageSize=50`,
  )
  // Latest submission per form template (session has one history; refills update)
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
  const data = await peerFetch<{ submission: FormSubmissionDetail }>(
    getDesignApiBase(),
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

export function resolveSaleId(item: CompanyActivityItem): string | null {
  if (item.type !== 'sale') return null
  const fromMeta = item.meta?.saleId
  if (typeof fromMeta === 'string' && fromMeta.length === 21) return fromMeta
  if (item.id.startsWith('sale:')) return item.id.slice('sale:'.length)
  return null
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

export async function getSaleHistoryDetail(saleId: string): Promise<SaleHistoryDetail> {
  return peerFetch<SaleHistoryDetail>(
    getWebOnOneApiBase(),
    `/company/me/sales/${encodeURIComponent(saleId)}`,
  )
}

export function getDesignOrigin(): string {
  return import.meta.env.VITE_DESIGN_ORIGIN ?? 'http://127.0.0.1:3019'
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

export const DESIGN_FORM_FILL_DIALOG_SIZE = {
  sizeWidth: 'large' as const,
  sizeHeight: 'xlarge' as const,
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

/** WebOnOne shell path that embeds Design fill/view for a published form. */
export function buildDesignFillPath(
  formTemplateId: string,
  query: Omit<DesignFormDialogSubject, 'formTemplateId'>,
): string {
  return `/design/forms/${formTemplateId}/fill?${designFormQueryParams({
    ...query,
    formTemplateId,
  }).toString()}`
}

/** Design peer-dialog body path for fill/view. */
export function buildDesignFormPeerDialogPath(subject: DesignFormDialogSubject): string {
  return `/embed/dialogs/forms/${encodeURIComponent(subject.formTemplateId)}/fill?${designFormQueryParams(subject).toString()}`
}

export function getDesignFormDialogCopy(
  subjectDisplayName: string,
  serviceName?: string | null,
  mode: DesignFormDialogMode = 'fill',
) {
  return {
    title: mode === 'view' ? 'View form' : 'Fill form',
    description: `For ${subjectDisplayName}${serviceName ? ` · ${serviceName}` : ''}`,
  }
}
