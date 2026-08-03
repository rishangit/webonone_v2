import { nanoid } from 'nanoid'
import { db } from '../models/db.js'
import type { SmsTemplateRow, SmsTemplateVersionRow, TemplateScope } from '../models/db.js'
import { estimateSegments, findMissingPlaceholders, renderPlaceholders } from '../utils/renderPlaceholders.js'
import { ensureLocalCompany } from './user.service.js'

export interface TemplateDto {
  id: string
  slug: string
  name: string
  body: string
  scope: TemplateScope
  companyId: string | null
  isActive: boolean
  requiredKeys: string[]
  createdAt: string
  updatedAt: string
  /** Platform template shown to company admins until they save a company override. */
  isDefault?: boolean
}

function parseRequiredKeys(row: SmsTemplateRow): string[] {
  if (!row.required_keys) return []
  if (Array.isArray(row.required_keys)) return row.required_keys
  try {
    const parsed = JSON.parse(row.required_keys) as unknown
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

function rowToDto(row: SmsTemplateRow): TemplateDto {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    body: row.body,
    scope: row.scope,
    companyId: row.company_id,
    isActive: row.is_active,
    requiredKeys: parseRequiredKeys(row),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

/** Company override wins over platform default; returns null if neither exists. */
export async function resolveTemplate(slug: string, companyId?: string | null): Promise<SmsTemplateRow | null> {
  if (companyId) {
    const companyTemplate = await db<SmsTemplateRow>('sms_templates')
      .where({ slug, scope: 'company', company_id: companyId, is_active: true })
      .first()
    if (companyTemplate) return companyTemplate
  }

  const platformTemplate = await db<SmsTemplateRow>('sms_templates')
    .where({ slug, scope: 'platform', is_active: true })
    .whereNull('company_id')
    .first()

  return platformTemplate ?? null
}

/**
 * Company-facing platform templates — shown to company admins as defaults,
 * hidden from the super-admin platform list.
 */
const SESSION_COMPANY_PLATFORM_SLUGS = [
  'session_token_issued',
  'session_started',
  'session_ended',
  'session_token_called',
  'appointment_booked',
  'appointment_reminder_24h',
] as const

/** Platform slugs company owners may see/customize as defaults (1.13.6). */
const COMPANY_DEFAULT_PLATFORM_SLUGS = new Set([
  'welcome',
  ...SESSION_COMPANY_PLATFORM_SLUGS,
])


export async function listTemplates(filters: { companyId?: string | null; role?: string }): Promise<TemplateDto[]> {
  if (filters.role === 'company_admin' && filters.companyId) {
    const companyRows = await db<SmsTemplateRow>('sms_templates')
      .where({ scope: 'company', company_id: filters.companyId })
      .orderBy('updated_at', 'desc')

    const platformRows = await db<SmsTemplateRow>('sms_templates')
      .where({ scope: 'platform', is_active: true })
      .whereNull('company_id')
      .whereIn('slug', [...COMPANY_DEFAULT_PLATFORM_SLUGS])
      .orderBy('updated_at', 'desc')

    const overriddenSlugs = new Set(companyRows.map((row) => row.slug))
    const defaults = platformRows
      .filter((row) => !overriddenSlugs.has(row.slug))
      .map((row) => ({ ...rowToDto(row), isDefault: true }))

    return [...companyRows.map(rowToDto), ...defaults]
  }

  const query = db<SmsTemplateRow>('sms_templates').orderBy('updated_at', 'desc')
  query
    .where({ scope: 'platform' })
    .whereNull('company_id')
    .whereNotIn('slug', [...SESSION_COMPANY_PLATFORM_SLUGS])
  const rows = await query
  return rows.map(rowToDto)
}

export async function getTemplateById(id: string): Promise<TemplateDto | null> {
  const row = await db<SmsTemplateRow>('sms_templates').where({ id }).first()
  return row ? rowToDto(row) : null
}

export async function validateTemplatePayload(
  template: SmsTemplateRow,
  payload: Record<string, string>,
): Promise<void> {
  const requiredKeys = parseRequiredKeys(template)
  const extras = { year: String(new Date().getFullYear()) }
  const missing = findMissingPlaceholders(requiredKeys, payload, extras)
  if (missing.length > 0) {
    throw new Error(`Missing required template placeholders: ${missing.join(', ')}`)
  }
}

export function renderBody(template: SmsTemplateRow, payload: Record<string, string>): string {
  const extras = { year: String(new Date().getFullYear()) }
  return renderPlaceholders(template.body, payload, extras)
}

export async function createTemplate(
  input: {
    slug: string
    name: string
    body: string
    scope: TemplateScope
    companyId: string | null
    requiredKeys?: string[]
    isActive?: boolean
  },
  userId?: string,
): Promise<TemplateDto> {
  const existing = await db<SmsTemplateRow>('sms_templates')
    .where({ slug: input.slug, scope: input.scope })
    .modify((qb) => {
      if (input.companyId) qb.where({ company_id: input.companyId })
      else qb.whereNull('company_id')
    })
    .first()
  if (existing) {
    throw new Error(`A template with slug "${input.slug}" already exists in this scope`)
  }

  const id = nanoid()
  await db('sms_templates').insert({
    id,
    slug: input.slug,
    name: input.name,
    body: input.body,
    scope: input.scope,
    company_id: input.companyId,
    is_active: input.isActive ?? true,
    required_keys: JSON.stringify(input.requiredKeys ?? []),
    created_at: db.fn.now(3),
    updated_at: db.fn.now(3),
  })

  await db('sms_template_versions').insert({
    id: nanoid(),
    template_id: id,
    body: input.body,
    version_number: 1,
    created_by: userId ?? null,
    created_at: db.fn.now(3),
  })

  const created = await db<SmsTemplateRow>('sms_templates').where({ id }).first()
  return rowToDto(created!)
}

export async function updateTemplate(
  id: string,
  input: { name?: string; body?: string; isActive?: boolean; requiredKeys?: string[] },
  userId?: string,
): Promise<TemplateDto> {
  const existing = await db<SmsTemplateRow>('sms_templates').where({ id }).first()
  if (!existing) {
    throw new Error('Template not found')
  }

  const patch: Partial<SmsTemplateRow> = {}
  if (input.name !== undefined) patch.name = input.name
  if (input.body !== undefined) patch.body = input.body
  if (input.isActive !== undefined) patch.is_active = input.isActive
  if (input.requiredKeys !== undefined) patch.required_keys = JSON.stringify(input.requiredKeys)

  await db('sms_templates').where({ id }).update({ ...patch, updated_at: db.fn.now(3) })

  const updated = await db<SmsTemplateRow>('sms_templates').where({ id }).first()
  const latestVersion = await db<SmsTemplateVersionRow>('sms_template_versions')
    .where({ template_id: id })
    .orderBy('version_number', 'desc')
    .first()

  await db('sms_template_versions').insert({
    id: nanoid(),
    template_id: id,
    body: updated!.body,
    version_number: (latestVersion?.version_number ?? 0) + 1,
    created_by: userId ?? null,
    created_at: db.fn.now(3),
  })

  return rowToDto(updated!)
}

export async function deleteTemplate(id: string): Promise<void> {
  await db('sms_templates').where({ id }).del()
}

export async function listTemplateVersions(templateId: string) {
  const rows = await db<SmsTemplateVersionRow>('sms_template_versions')
    .where({ template_id: templateId })
    .orderBy('version_number', 'desc')

  return rows.map((row) => ({
    id: row.id,
    templateId: row.template_id,
    body: row.body,
    versionNumber: row.version_number,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
  }))
}

export async function restoreTemplateVersion(
  templateId: string,
  versionId: string,
  userId?: string,
): Promise<TemplateDto> {
  const version = await db<SmsTemplateVersionRow>('sms_template_versions')
    .where({ id: versionId, template_id: templateId })
    .first()
  if (!version) {
    throw new Error('Template version not found')
  }
  return updateTemplate(templateId, { body: version.body }, userId)
}

export async function previewTemplate(templateId: string, payload: Record<string, string>) {
  const row = await db<SmsTemplateRow>('sms_templates').where({ id: templateId }).first()
  if (!row) {
    throw new Error('Template not found')
  }
  const samplePayload = {
    code: '483921',
    minutes: '5',
    name: 'Sample User',
    companyName: 'Sample Company',
    body: 'Sample message body',
    ...payload,
  }
  const body = renderBody(row, samplePayload)
  return { body, ...estimateSegments(body) }
}

export function canAccessTemplate(template: TemplateDto, role: string, userCompanyId: string | null): boolean {
  if (role === 'super_admin') return template.scope === 'platform'
  if (role === 'company_admin') {
    if (template.scope === 'company' && template.companyId === userCompanyId) return true
    if (
      template.scope === 'platform' &&
      !template.companyId &&
      COMPANY_DEFAULT_PLATFORM_SLUGS.has(template.slug)
    ) {
      return true
    }
    return false
  }
  return false
}

/** Create a company override from a platform template (first company edit of a default). */
export async function createCompanyOverrideFromPlatform(
  platformTemplateId: string,
  companyId: string,
  input: {
    name?: string
    body?: string
    requiredKeys?: string[]
    isActive?: boolean
  },
  userId?: string,
): Promise<TemplateDto> {
  await ensureLocalCompany({ companyId })

  const platform = await db<SmsTemplateRow>('sms_templates').where({ id: platformTemplateId }).first()
  if (!platform || platform.scope !== 'platform') {
    throw new Error('Platform template not found')
  }

  const existing = await db<SmsTemplateRow>('sms_templates')
    .where({ slug: platform.slug, scope: 'company', company_id: companyId })
    .first()
  if (existing) {
    return updateTemplate(existing.id, input, userId)
  }

  return createTemplate(
    {
      slug: platform.slug,
      name: input.name ?? platform.name,
      body: input.body ?? platform.body,
      scope: 'company',
      companyId,
      requiredKeys: input.requiredKeys ?? parseRequiredKeys(platform),
      isActive: input.isActive ?? platform.is_active,
    },
    userId,
  )
}

const DEFAULT_WELCOME_BODY = 'Welcome to {{companyName}}, {{userName}}!'
const DEFAULT_WELCOME_KEYS = ['userName', 'companyName']

export async function ensureWelcomeTemplate(
  companyId: string,
  companyName?: string,
): Promise<{ status: 'created' | 'exists'; templateId: string }> {
  await ensureLocalCompany({ companyId, name: companyName })

  const existing = await db<SmsTemplateRow>('sms_templates')
    .where({ slug: 'welcome', scope: 'company', company_id: companyId })
    .first()

  if (existing) {
    return { status: 'exists', templateId: existing.id }
  }

  const platform = await db<SmsTemplateRow>('sms_templates')
    .where({ slug: 'welcome', scope: 'platform' })
    .whereNull('company_id')
    .first()

  const created = await createTemplate({
    slug: 'welcome',
    name: platform?.name ?? 'Welcome',
    body: platform?.body ?? DEFAULT_WELCOME_BODY,
    scope: 'company',
    companyId,
    requiredKeys: platform ? parseRequiredKeys(platform) : [...DEFAULT_WELCOME_KEYS],
    isActive: true,
  })

  return { status: 'created', templateId: created.id }
}
