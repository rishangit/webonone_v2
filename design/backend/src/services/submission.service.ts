import { nanoid } from 'nanoid'
import { db } from '../models/db.js'
import { env } from '../config/env.js'
import { getForm, HttpError } from './form.service.js'
import { getCompanyFromWebOnOne } from './webononeCompanyClient.js'
import { fetchUserContactsByIds } from './identityUserClient.js'
import { fetchServicesByIds } from './dataCatalogClient.js'
import type { CreateSubmissionBody } from '../schemas/submissionSchemas.js'
import type { FormDefinition } from '../schemas/formSchemas.js'

export type FormSubmissionDto = {
  id: string
  companyId: string
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

type SubmissionRow = {
  id: string
  company_id: string
  form_template_id: string
  form_name: string | null
  subject_user_id: string
  filled_by_user_id: string
  service_id: string | null
  event_id: string | null
  occurrence_date: string | Date | null
  session_token_id: string | null
  answers: string | Record<string, unknown>
  created_at: Date
}

function formatOccurrenceDate(value: string | Date | null | undefined): string | null {
  if (value == null) return null
  if (typeof value === 'string') return value.slice(0, 10)
  return value.toISOString().slice(0, 10)
}

function parseAnswers(raw: SubmissionRow['answers']): Record<string, unknown> {
  if (typeof raw === 'string') {
    return JSON.parse(raw) as Record<string, unknown>
  }
  return raw ?? {}
}

function submissionsBaseQuery() {
  return db('design_form_submissions as s')
    .leftJoin('design_form_templates as t', 't.id', 's.form_template_id')
    .select(
      's.id',
      's.company_id',
      's.form_template_id',
      't.name as form_name',
      's.subject_user_id',
      's.filled_by_user_id',
      's.service_id',
      's.event_id',
      's.occurrence_date',
      's.session_token_id',
      's.answers',
      's.created_at',
    )
}

async function enrichRows(rows: SubmissionRow[]): Promise<FormSubmissionDto[]> {
  if (rows.length === 0) return []

  const userIds = rows.flatMap((row) => [row.subject_user_id, row.filled_by_user_id])
  const serviceIds = rows.map((row) => row.service_id).filter((id): id is string => Boolean(id))

  const [contacts, services] = await Promise.all([
    fetchUserContactsByIds(userIds),
    fetchServicesByIds(serviceIds),
  ])

  return rows.map((row) => {
    const subject = contacts.get(row.subject_user_id)
    const filler = contacts.get(row.filled_by_user_id)
    const service = row.service_id ? services.get(row.service_id) : undefined
    return {
      id: row.id,
      companyId: row.company_id,
      formTemplateId: row.form_template_id,
      formName: row.form_name?.trim() || 'Form',
      subjectUserId: row.subject_user_id,
      subjectDisplayName: subject?.displayName || row.subject_user_id,
      subjectEmail: subject?.email ?? null,
      filledByUserId: row.filled_by_user_id,
      filledByDisplayName: filler?.displayName || filler?.email || row.filled_by_user_id,
      serviceId: row.service_id,
      serviceName: service?.name ?? null,
      eventId: row.event_id,
      occurrenceDate: formatOccurrenceDate(row.occurrence_date),
      sessionTokenId: row.session_token_id,
      answers: parseAnswers(row.answers),
      createdAt: new Date(row.created_at).toISOString(),
    }
  })
}

function validateAnswersAgainstDefinition(
  definition: FormDefinition,
  answers: Record<string, unknown>,
): void {
  for (const field of definition.fields) {
    const value = answers[field.id]
    if (field.required) {
      if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
        throw new HttpError(400, `Field "${field.label}" is required`, 'VALIDATION_FAILED')
      }
    }
  }
}

async function assertCanFillForms(input: {
  userId: string
  companyId: string
  role: string
}): Promise<void> {
  if (input.role === 'company_admin' || input.role === 'super_admin') {
    return
  }

  const apiBase = env.webononeApiBaseUrl.replace(/\/$/, '')
  const apiKey = env.webononeServiceApiKey
  if (!apiBase || !apiKey) {
    throw new HttpError(503, 'Staff verification is not configured', 'STAFF_CHECK_UNAVAILABLE')
  }

  const url = `${apiBase}/api/v1/internal/company-staff/by-user/${encodeURIComponent(input.userId)}?companyId=${encodeURIComponent(input.companyId)}`
  const res = await fetch(url, {
    headers: {
      'X-WebOnOne-Service-Key': apiKey,
      Accept: 'application/json',
    },
  })
  if (!res.ok) {
    throw new HttpError(503, 'Unable to verify staff membership', 'STAFF_CHECK_FAILED')
  }
  const data = (await res.json()) as { isStaff?: boolean }
  if (!data.isStaff) {
    throw new HttpError(403, 'Only company admins and staff can fill forms', 'FORBIDDEN')
  }
}

export async function createSubmission(input: {
  companyId: string
  filledByUserId: string
  filledByRole: string
  body: CreateSubmissionBody
}): Promise<FormSubmissionDto> {
  if (input.body.subjectUserId === input.filledByUserId) {
    throw new HttpError(400, 'Cannot fill a form for yourself', 'SELF_FILL_FORBIDDEN')
  }

  await assertCanFillForms({
    userId: input.filledByUserId,
    companyId: input.companyId,
    role: input.filledByRole,
  })

  await getCompanyFromWebOnOne(input.companyId)

  const form = await getForm({ companyId: input.companyId, id: input.body.formTemplateId })
  if (form.status !== 'published') {
    throw new HttpError(400, 'Only published forms can be filled', 'FORM_NOT_PUBLISHED')
  }

  validateAnswersAgainstDefinition(form.definition, input.body.answers)

  // One submission per form per event session token — refill updates, does not create a new history row.
  const sessionTokenId = input.body.sessionTokenId ?? null
  if (sessionTokenId) {
    const existing = await db<SubmissionRow>('design_form_submissions')
      .where({
        company_id: input.companyId,
        session_token_id: sessionTokenId,
        form_template_id: form.id,
      })
      .orderBy('created_at', 'desc')
      .first()

    if (existing) {
      await db('design_form_submissions').where({ id: existing.id }).update({
        subject_user_id: input.body.subjectUserId,
        filled_by_user_id: input.filledByUserId,
        service_id: input.body.serviceId ?? null,
        event_id: input.body.eventId ?? null,
        occurrence_date: input.body.occurrenceDate ?? null,
        answers: JSON.stringify(input.body.answers),
      })
      return getSubmission({ companyId: input.companyId, id: existing.id })
    }
  } else if (input.body.eventId && input.body.occurrenceDate) {
    // Duration sessions (no token): one submission per form per attendee per occurrence.
    const existing = await db<SubmissionRow>('design_form_submissions')
      .where({
        company_id: input.companyId,
        form_template_id: form.id,
        subject_user_id: input.body.subjectUserId,
        event_id: input.body.eventId,
        occurrence_date: input.body.occurrenceDate,
      })
      .whereNull('session_token_id')
      .orderBy('created_at', 'desc')
      .first()

    if (existing) {
      await db('design_form_submissions').where({ id: existing.id }).update({
        filled_by_user_id: input.filledByUserId,
        service_id: input.body.serviceId ?? null,
        answers: JSON.stringify(input.body.answers),
      })
      return getSubmission({ companyId: input.companyId, id: existing.id })
    }
  }

  const id = nanoid()
  await db('design_form_submissions').insert({
    id,
    company_id: input.companyId,
    form_template_id: form.id,
    subject_user_id: input.body.subjectUserId,
    filled_by_user_id: input.filledByUserId,
    service_id: input.body.serviceId ?? null,
    event_id: input.body.eventId ?? null,
    occurrence_date: input.body.occurrenceDate ?? null,
    session_token_id: sessionTokenId,
    answers: JSON.stringify(input.body.answers),
    created_at: db.fn.now(3),
  })

  return getSubmission({ companyId: input.companyId, id })
}

export async function getSubmission(input: {
  companyId: string
  id: string
}): Promise<FormSubmissionDto> {
  const row = (await submissionsBaseQuery()
    .where({ 's.id': input.id, 's.company_id': input.companyId })
    .first()) as SubmissionRow | undefined
  if (!row) {
    throw new HttpError(404, 'Submission not found', 'SUBMISSION_NOT_FOUND')
  }
  const [dto] = await enrichRows([row])
  return dto
}

export async function listSubmissions(input: {
  companyId: string
  subjectUserId?: string
  filledByUserId?: string
  sessionTokenId?: string
  eventId?: string
  occurrenceDate?: string
  page?: number
  pageSize?: number
}): Promise<{ items: FormSubmissionDto[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20))
  const offset = (page - 1) * pageSize

  let query = submissionsBaseQuery().where({ 's.company_id': input.companyId })
  if (input.subjectUserId) {
    query = query.andWhere({ 's.subject_user_id': input.subjectUserId })
  }
  if (input.filledByUserId) {
    query = query.andWhere({ 's.filled_by_user_id': input.filledByUserId })
  }
  if (input.sessionTokenId) {
    query = query.andWhere({ 's.session_token_id': input.sessionTokenId })
  }
  if (input.eventId) {
    query = query.andWhere({ 's.event_id': input.eventId })
  }
  if (input.occurrenceDate) {
    query = query.andWhere({ 's.occurrence_date': input.occurrenceDate })
  }

  const countRow = await query
    .clone()
    .clearSelect()
    .count<{ count: number | string }[]>({ count: '*' })
    .first()
  const total = Number(countRow?.count ?? 0)

  const rows = (await query
    .clone()
    .orderBy('s.created_at', 'desc')
    .limit(pageSize)
    .offset(offset)) as SubmissionRow[]

  return {
    items: await enrichRows(rows),
    total,
    page,
    pageSize,
  }
}
