import { nanoid } from 'nanoid'
import { db, type DesignFormTemplateRow, type FormTemplateStatus } from '../models/db.js'
import { HttpError } from './httpError.js'
import { getCompanyFromWebOnOne } from './webononeCompanyClient.js'
import type { CreateFormBody, FormDefinition, UpdateFormBody } from '../schemas/formSchemas.js'

export type FormTemplateDto = {
  id: string
  companyId: string
  name: string
  slug: string
  definition: FormDefinition
  status: FormTemplateStatus
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

function parseDefinition(raw: DesignFormTemplateRow['definition']): FormDefinition {
  if (typeof raw === 'string') {
    return JSON.parse(raw) as FormDefinition
  }
  return raw as FormDefinition
}

function toDto(row: DesignFormTemplateRow): FormTemplateDto {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    slug: row.slug,
    definition: parseDefinition(row.definition),
    status: row.status,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export { HttpError } from './httpError.js'

export async function listForms(input: {
  companyId: string
  page?: number
  pageSize?: number
  q?: string
  status?: FormTemplateStatus
}): Promise<{ items: FormTemplateDto[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20))
  const offset = (page - 1) * pageSize

  let query = db<DesignFormTemplateRow>('design_form_templates').where({
    company_id: input.companyId,
  })
  if (input.status) {
    query = query.andWhere({ status: input.status })
  }
  if (input.q?.trim()) {
    const q = `%${input.q.trim().toLowerCase()}%`
    query = query.andWhere((builder) => {
      builder
        .whereRaw('LOWER(name) LIKE ?', [q])
        .orWhereRaw('LOWER(slug) LIKE ?', [q])
    })
  }

  const countRow = await query.clone().count<{ count: number | string }[]>({ count: '*' }).first()
  const total = Number(countRow?.count ?? 0)

  const rows = await query
    .clone()
    .orderBy('updated_at', 'desc')
    .limit(pageSize)
    .offset(offset)

  return {
    items: rows.map(toDto),
    total,
    page,
    pageSize,
  }
}

export async function getForm(input: {
  companyId: string
  id: string
}): Promise<FormTemplateDto> {
  const row = await db<DesignFormTemplateRow>('design_form_templates')
    .where({ id: input.id, company_id: input.companyId })
    .first()
  if (!row) {
    throw new HttpError(404, 'Form not found', 'FORM_NOT_FOUND')
  }
  return toDto(row)
}

export async function createForm(input: {
  companyId: string
  userId: string
  body: CreateFormBody
}): Promise<FormTemplateDto> {
  // Confirm company exists in WebOnOne (source of truth); store only company_id locally
  await getCompanyFromWebOnOne(input.companyId)

  const existing = await db('design_form_templates')
    .where({ company_id: input.companyId, slug: input.body.slug })
    .first()
  if (existing) {
    throw new HttpError(409, 'A form with this slug already exists', 'FORM_SLUG_TAKEN')
  }

  const id = nanoid()
  await db('design_form_templates').insert({
    id,
    company_id: input.companyId,
    name: input.body.name,
    slug: input.body.slug,
    definition: JSON.stringify(input.body.definition),
    status: input.body.status,
    created_by: input.userId,
    created_at: db.fn.now(3),
    updated_at: db.fn.now(3),
  })

  return getForm({ companyId: input.companyId, id })
}

export async function updateForm(input: {
  companyId: string
  id: string
  body: UpdateFormBody
}): Promise<FormTemplateDto> {
  const existing = await db<DesignFormTemplateRow>('design_form_templates')
    .where({ id: input.id, company_id: input.companyId })
    .first()
  if (!existing) {
    throw new HttpError(404, 'Form not found', 'FORM_NOT_FOUND')
  }

  if (input.body.slug && input.body.slug !== existing.slug) {
    const clash = await db('design_form_templates')
      .where({ company_id: input.companyId, slug: input.body.slug })
      .whereNot({ id: input.id })
      .first()
    if (clash) {
      throw new HttpError(409, 'A form with this slug already exists', 'FORM_SLUG_TAKEN')
    }
  }

  const updates: Record<string, unknown> = {
    updated_at: db.fn.now(3),
  }
  if (input.body.name != null) updates.name = input.body.name
  if (input.body.slug != null) updates.slug = input.body.slug
  if (input.body.status != null) updates.status = input.body.status
  if (input.body.definition != null) updates.definition = JSON.stringify(input.body.definition)

  await db('design_form_templates').where({ id: input.id }).update(updates)
  return getForm({ companyId: input.companyId, id: input.id })
}

export async function deleteForm(input: { companyId: string; id: string }): Promise<void> {
  const deleted = await db('design_form_templates')
    .where({ id: input.id, company_id: input.companyId })
    .del()
  if (!deleted) {
    throw new HttpError(404, 'Form not found', 'FORM_NOT_FOUND')
  }
}
