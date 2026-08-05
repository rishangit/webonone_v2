const DEFAULT_DESIGN_ORIGIN = 'http://127.0.0.1:3019'
const DEFAULT_DESIGN_API_BASE = 'http://127.0.0.1:4019/api/v1'

export function getDesignOrigin(): string {
  return import.meta.env.VITE_DESIGN_ORIGIN ?? DEFAULT_DESIGN_ORIGIN
}

export function getDesignApiBaseUrl(): string {
  return import.meta.env.VITE_DESIGN_API_BASE_URL ?? DEFAULT_DESIGN_API_BASE
}

export function getDesignAppUrl(path = '/forms'): string {
  const base = getDesignOrigin().replace(/\/$/, '')
  if (path === '/' || path === '') {
    return `${base}/`
  }
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export type DesignFillSubjectQuery = {
  subjectUserId: string
  subjectDisplayName: string
  subjectEmail?: string | null
  serviceId?: string | null
  serviceName?: string | null
  eventId?: string | null
  occurrenceDate?: string | null
  sessionTokenId?: string | null
  mode?: 'fill' | 'view' | 'edit'
  submissionId?: string | null
}

function fillQueryParams(query: DesignFillSubjectQuery): URLSearchParams {
  const params = new URLSearchParams()
  params.set('subjectUserId', query.subjectUserId)
  params.set('subjectDisplayName', query.subjectDisplayName)
  if (query.subjectEmail) params.set('subjectEmail', query.subjectEmail)
  if (query.serviceId) params.set('serviceId', query.serviceId)
  if (query.serviceName) params.set('serviceName', query.serviceName)
  if (query.eventId) params.set('eventId', query.eventId)
  if (query.occurrenceDate) params.set('occurrenceDate', query.occurrenceDate)
  if (query.sessionTokenId) params.set('sessionTokenId', query.sessionTokenId)
  if (query.mode === 'view' || query.mode === 'edit') params.set('mode', query.mode)
  if (query.submissionId) params.set('submissionId', query.submissionId)
  return params
}

/** WebOnOne shell path that embeds Design fill for a published form. */
export function buildDesignFillShellPath(
  formTemplateId: string,
  query: DesignFillSubjectQuery,
): string {
  return `/design/forms/${formTemplateId}/fill?${fillQueryParams(query).toString()}`
}

/** Design peer-dialog body path for fill (host CustomDialog + iframe). */
export function buildDesignFillPeerDialogPath(
  formTemplateId: string,
  query: DesignFillSubjectQuery,
): string {
  return `/embed/dialogs/forms/${encodeURIComponent(formTemplateId)}/fill?${fillQueryParams(query).toString()}`
}

export const DESIGN_FORM_FILL_DIALOG_SIZE = {
  sizeWidth: 'large' as const,
  sizeHeight: 'xlarge' as const,
}
